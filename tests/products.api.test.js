import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import createApp from '../src/app.js';
import { productModel } from '../src/models/product.js';

describe('Products API Integration Tests', () => {
  const app = createApp();

  beforeEach(() => {
    productModel.clearStore();
    // Seed data
    productModel.create({
      name: 'Gaming Laptop',
      sku: 'LAP-001',
      price: 1200.00,
      stock: 10,
      category: 'electronics',
      description: 'High performance gaming laptop'
    });
    productModel.create({
      name: 'Cotton T-Shirt',
      sku: 'TSH-001',
      price: 20.00,
      stock: 0,
      category: 'clothing',
      description: 'Comfortable cotton t-shirt'
    });
  });

  describe('GET /products', () => {
    it('should return 200 and an array of products', async () => {
      const res = await request(app).get('/products');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
      assert.strictEqual(res.body.data.length, 2);
    });

    it('should return only non-archived products', async () => {
      const p = productModel.create({ name: 'Archived', sku: 'ARC-01', price: 10, stock: 5 });
      productModel.delete(p.id);

      const res = await request(app).get('/products');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 2); // Only seed data
      assert.ok(!res.body.data.some(p => p.sku === 'ARC-01'));
    });

    it('should filter by category', async () => {
      const res = await request(app).get('/products?category=electronics');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 1);
      assert.strictEqual(res.body.data[0].category, 'electronics');
    });

    it('should return 422 for unknown category', async () => {
      const res = await request(app).get('/products?category=unknown');
      assert.strictEqual(res.status, 422);
    });

    it('should filter by minPrice and maxPrice', async () => {
      const res = await request(app).get('/products?minPrice=15&maxPrice=25');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 1);
      assert.strictEqual(res.body.data[0].sku, 'TSH-001');
    });

    it('should handle non-numeric minPrice gracefully (expect 422)', async () => {
      const res = await request(app).get('/products?minPrice=abc');
      assert.strictEqual(res.status, 422);
    });

    it('should filter by inStock=true', async () => {
      const res = await request(app).get('/products?inStock=true');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 1);
      assert.strictEqual(res.body.data[0].sku, 'LAP-001');
    });

    it('should match search term in name and description', async () => {
      const res = await request(app).get('/products?search=gaming');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 1);
      assert.strictEqual(res.body.data[0].sku, 'LAP-001');
    });
  });

  describe('GET /products/:id', () => {
    it('should return 200 with the correct product', async () => {
      const p = productModel.create({ name: 'Finder', sku: 'FND-01', price: 10, stock: 1 });
      const res = await request(app).get(`/products/${p.id}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.id, p.id);
      assert.strictEqual(res.body.data.sku, 'FND-01');
    });

    it('should return 404 for an unknown id', async () => {
      const res = await request(app).get('/products/unknown-id');
      assert.strictEqual(res.status, 404);
    });

    it('should return 404 for an archived product id', async () => {
      const p = productModel.create({ name: 'Gone', sku: 'GON-01', price: 10, stock: 1 });
      productModel.delete(p.id);
      const res = await request(app).get(`/products/${p.id}`);
      assert.strictEqual(res.status, 404);
    });
  });

  describe('POST /products', () => {
    it('should return 201 with created product including id and createdAt', async () => {
      const body = {
        name: 'New Product',
        sku: 'NEW-001',
        price: 99.99,
        stock: 20,
        category: 'books'
      };
      const res = await request(app).post('/products').send(body);
      assert.strictEqual(res.status, 201);
      assert.ok(res.body.data.id);
      assert.ok(res.body.data.createdAt);
      assert.strictEqual(res.body.data.name, body.name);
    });

    it('should return 422 when name is missing', async () => {
      const res = await request(app).post('/products').send({ sku: 'S1', price: 10, stock: 10 });
      assert.strictEqual(res.status, 422);
    });

    it('should return 422 when price is zero or negative', async () => {
      const resZero = await request(app).post('/products').send({ name: 'N1', sku: 'S1', price: 0, stock: 10 });
      assert.strictEqual(resZero.status, 422);
      const resNeg = await request(app).post('/products').send({ name: 'N2', sku: 'S2', price: -10, stock: 10 });
      assert.strictEqual(resNeg.status, 422);
    });

    it('should accept stock = 0', async () => {
      const res = await request(app).post('/products').send({
        name: 'Out of Stock',
        sku: 'OOS-01',
        price: 10,
        stock: 0
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.stock, 0);
    });

    it('should return 409 when sku already exists', async () => {
      const res = await request(app).post('/products').send({
        name: 'Duplicate',
        sku: 'LAP-001',
        price: 100,
        stock: 10
      });
      assert.strictEqual(res.status, 409);
    });

    it('should only allow one of two concurrent POSTs with same SKU to succeed', async () => {
      const body = { name: 'Concurrent', sku: 'CON-01', price: 10, stock: 10 };
      const results = await Promise.all([
        request(app).post('/products').send(body),
        request(app).post('/products').send(body)
      ]);

      const successes = results.filter(r => r.status === 201);
      const conflicts = results.filter(r => r.status === 409);

      assert.strictEqual(successes.length, 1);
      assert.strictEqual(conflicts.length, 1);
    });
  });

  describe('PATCH /products/:id', () => {
    it('should return 200 with only patched fields changed', async () => {
      const p = productModel.create({ name: 'Patch Me', sku: 'PM-01', price: 10, stock: 10 });
      const res = await request(app).patch(`/products/${p.id}`).send({ price: 15 });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.price, 15);
      assert.strictEqual(res.body.data.name, 'Patch Me');
    });

    it('should strip unknown fields from patch', async () => {
      const p = productModel.create({ name: 'Clean Me', sku: 'CL-01', price: 10, stock: 10 });
      const res = await request(app).patch(`/products/${p.id}`).send({
        price: 15,
        unknownField: 'should be gone'
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.price, 15);
      assert.strictEqual(res.body.data.unknownField, undefined);
    });

    it('should return 404 for an unknown id', async () => {
      const res = await request(app).patch('/products/unknown').send({ price: 20 });
      assert.strictEqual(res.status, 404);
    });

    it('should return 400 when the body is empty', async () => {
      const p = productModel.create({ name: 'Empty', sku: 'EMP-01', price: 10, stock: 10 });
      const res = await request(app).patch(`/products/${p.id}`).send({});
      assert.strictEqual(res.status, 400);
    });

    it('should return 404 when patching an archived product', async () => {
      const p = productModel.create({ name: 'Archived', sku: 'ARC-01', price: 10, stock: 10 });
      productModel.delete(p.id);
      const res = await request(app).patch(`/products/${p.id}`).send({ price: 20 });
      assert.strictEqual(res.status, 404);
    });

    it('should not allow updating sku or id', async () => {
      const p = productModel.create({ name: 'Strict', sku: 'STR-01', price: 10, stock: 10 });
      const res = await request(app).patch(`/products/${p.id}`).send({
        id: 'new-id',
        sku: 'new-sku',
        price: 20
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.id, p.id);
      assert.strictEqual(res.body.data.sku, 'STR-01');
      assert.strictEqual(res.body.data.price, 20);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should return 204 and subsequent GET returns 404', async () => {
      const p = productModel.create({ name: 'Delete Me', sku: 'DEL-01', price: 10, stock: 10 });
      const delRes = await request(app).delete(`/products/${p.id}`);
      assert.strictEqual(delRes.status, 204);

      const getRes = await request(app).get(`/products/${p.id}`);
      assert.strictEqual(getRes.status, 404);
    });
  });

  describe('DELETE /products/:id/restore', () => {
    it('should return 200 and product reappears in GET /products', async () => {
      const p = productModel.create({ name: 'Restore Me', sku: 'RES-01', price: 10, stock: 10 });
      await request(app).delete(`/products/${p.id}`);

      const res = await request(app).delete(`/products/${p.id}/restore`);
      assert.strictEqual(res.status, 200);

      const listRes = await request(app).get('/products');
      assert.ok(listRes.body.data.some(prod => prod.id === p.id));
    });

    it('should return 404 when restoring a product that was never archived', async () => {
      const p = productModel.create({ name: 'Not Archived', sku: 'NA-01', price: 10, stock: 10 });
      // The current restore implementation in model just sets archivedAt = null.
      // The controller checks if restored is true/false.
      // In model, restore() returns true if product exists.
      // We need to decide if restoring a non-archived product is an error.
      // Based on the request: "Restore a product that was never archived -- expect 400 or 404"
      // I will implement this check in the controller or model.
      const res = await request(app).delete(`/products/${p.id}/restore`);
      // Expecting 400 based on requirement.
      assert.strictEqual(res.status, 400);
    });
  });
});
