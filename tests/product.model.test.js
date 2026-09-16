import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { productModel } from '../src/models/product.js';

describe('Product Model', () => {
  beforeEach(() => {
    productModel.clearStore();
  });

  describe('create()', () => {
    it('should return a product with all required fields including a uuid id', () => {
      const data = {
        name: 'Wireless Mouse',
        sku: 'WM-001',
        price: 29.99,
        stock: 50,
        category: 'electronics'
      };
      const product = productModel.create(data);
      assert.ok(product.id);
      assert.strictEqual(product.name, data.name);
      assert.strictEqual(product.sku, data.sku);
      assert.strictEqual(product.price, data.price);
      assert.strictEqual(product.stock, data.stock);
      assert.strictEqual(product.category, data.category);
      assert.ok(product.createdAt instanceof Date);
    });

    it('should set status to "active" and archivedAt to null by default', () => {
      const product = productModel.create({
        name: 'Test Product',
        sku: 'TP-001',
        price: 10,
        stock: 10
      });
      assert.strictEqual(product.status, 'active');
      assert.strictEqual(product.archivedAt, null);
    });

    it('should throw if name is missing', () => {
      assert.throws(() => {
        productModel.create({ sku: 'S1', price: 10, stock: 10 });
      }, /Product name is required/);
    });

    it('should throw if sku is missing', () => {
      assert.throws(() => {
        productModel.create({ name: 'N1', price: 10, stock: 10 });
      }, /Product SKU is required/);
    });

    it('should throw if price is zero or negative', () => {
      assert.throws(() => {
        productModel.create({ name: 'N1', sku: 'S1', price: 0, stock: 10 });
      }, /Product price must be a positive number/);
      assert.throws(() => {
        productModel.create({ name: 'N1', sku: 'S1', price: -5, stock: 10 });
      }, /Product price must be a positive number/);
    });

    it('should allow stock to be zero', () => {
      const product = productModel.create({ name: 'OutOfStock', sku: 'OOS-01', price: 10, stock: 0 });
      assert.strictEqual(product.stock, 0);
    });

    it('should throw if a product with the same sku already exists', () => {
      productModel.create({ name: 'P1', sku: 'S1', price: 10, stock: 10 });
      assert.throws(() => {
        productModel.create({ name: 'P2', sku: 'S1', price: 20, stock: 20 });
      }, /Product with this SKU already exists/);
    });
  });

  describe('findAll()', () => {
    it('should return all non-archived products', () => {
      productModel.create({ name: 'P1', sku: 'S1', price: 10, stock: 10 });
      productModel.create({ name: 'P2', sku: 'S2', price: 20, stock: 20 });
      const p3 = productModel.create({ name: 'P3', sku: 'S3', price: 30, stock: 30 });
      productModel.delete(p3.id);

      const products = productModel.findAll();
      assert.strictEqual(products.length, 2);
    });

    it('should return empty array when the store is empty', () => {
      assert.deepStrictEqual(productModel.findAll(), []);
    });

    it('should return only products matching the category', () => {
      productModel.create({ name: 'P1', sku: 'S1', price: 10, stock: 10, category: 'electronics' });
      productModel.create({ name: 'P2', sku: 'S2', price: 20, stock: 20, category: 'clothing' });

      const electronics = productModel.findAll({ category: 'electronics' });
      assert.strictEqual(electronics.length, 1);
      assert.strictEqual(electronics[0].category, 'electronics');
    });

    it('should return products with price within the range (inclusive)', () => {
      productModel.create({ name: 'P1', sku: 'S1', price: 10, stock: 10 });
      productModel.create({ name: 'P2', sku: 'S2', price: 20, stock: 20 });
      productModel.create({ name: 'P3', sku: 'S3', price: 30, stock: 30 });

      const filtered = productModel.findAll({ minPrice: 15, maxPrice: 25 });
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].price, 20);

      const inclusive = productModel.findAll({ minPrice: 10, maxPrice: 20 });
      assert.strictEqual(inclusive.length, 2);
    });

    it('should return only products with stock > 0 when inStock is "true"', () => {
      productModel.create({ name: 'P1', sku: 'S1', price: 10, stock: 10 });
      productModel.create({ name: 'P2', sku: 'S2', price: 20, stock: 0 });

      const inStock = productModel.findAll({ inStock: 'true' });
      assert.strictEqual(inStock.length, 1);
      assert.strictEqual(inStock[0].stock, 10);
    });

    it('should return products whose name or description contains the search term', () => {
      productModel.create({ name: 'Wireless Mouse', sku: 'S1', price: 10, stock: 10, description: 'A great mouse' });
      productModel.create({ name: 'Wired Keyboard', sku: 'S2', price: 20, stock: 20, description: 'Wireless connectivity' });
      productModel.create({ name: 'Cable', sku: 'S3', price: 30, stock: 30, description: 'USB cable' });

      const results = productModel.findAll({ search: 'wireless' });
      assert.strictEqual(results.length, 2);
    });
  });

  describe('findById()', () => {
    it('should return the correct product', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10, stock: 10 });
      const found = productModel.findById(p.id);
      assert.deepStrictEqual(found, p);
    });

    it('should return null for unknown id', () => {
      assert.strictEqual(productModel.findById('unknown'), null);
    });

    it('should return null for an archived product id', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10, stock: 10 });
      productModel.delete(p.id);
      assert.strictEqual(productModel.findById(p.id), null);
    });
  });

  describe('findBySku()', () => {
    it('should return the correct product', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10, stock: 10 });
      const found = productModel.findBySku('S1');
      assert.deepStrictEqual(found, p);
    });

    it('should return null for unknown sku', () => {
      assert.strictEqual(productModel.findBySku('unknown'), null);
    });
  });

  describe('update()', () => {
    it('should update only the provided fields', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10, stock: 10 });
      const updated = productModel.update(p.id, { price: 15 });
      assert.strictEqual(updated.price, 15);
      assert.strictEqual(updated.name, 'P1');
    });

    it('should not allow overwriting id or createdAt', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10, stock: 10 });
      const originalId = p.id;
      const originalCreatedAt = p.createdAt;

      const updated = productModel.update(p.id, {
        id: 'new-id',
        createdAt: new Date(0),
        price: 20
      });

      assert.strictEqual(updated.id, originalId);
      assert.strictEqual(updated.createdAt, originalCreatedAt);
      assert.strictEqual(updated.price, 20);
    });
  });

  describe('delete()', () => {
    it('should set archivedAt (soft archive, record is kept)', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10, stock: 10 });
      const result = productModel.delete(p.id);
      assert.strictEqual(result, true);

      const foundBySku = productModel.findBySku('S1');
      assert.ok(foundBySku);
      assert.ok(foundBySku.archivedAt instanceof Date);
    });

    it('should exclude archived product from findAll()', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10, stock: 10 });
      productModel.delete(p.id);
      const all = productModel.findAll();
      assert.strictEqual(all.length, 0);
    });
  });

  describe('restore()', () => {
    it('should clear archivedAt', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10, stock: 10 });
      productModel.delete(p.id);
      productModel.restore(p.id);

      const found = productModel.findById(p.id);
      assert.ok(found);
      assert.strictEqual(found.archivedAt, null);
    });

    it('should make restored product reappear in findAll()', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10, stock: 10 });
      productModel.delete(p.id);
      assert.strictEqual(productModel.findAll().length, 0);

      productModel.restore(p.id);
      assert.strictEqual(productModel.findAll().length, 1);
    });
  });
});
