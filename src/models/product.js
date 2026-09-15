import { v4 as uuidv4 } from 'uuid';

const products = new Map();

const VALID_CATEGORIES = ['electronics', 'clothing', 'food', 'books', 'other'];
const VALID_STATUSES = ['active', 'inactive', 'discontinued'];

export const productModel = {
  findAll: ({ category, status } = {}) => {
    let result = Array.from(products.values());
    if (category) result = result.filter(p => p.category === category);
    if (status) result = result.filter(p => p.status === status);
    return result;
  },

  findById: (id) => products.get(id),

  findBySku: (sku) => Array.from(products.values()).find(p => p.sku === sku),

  create: (data) => {
    if (productModel.findBySku(data.sku)) {
      throw new Error('Product with this SKU already exists');
    }

    if (data.category && !VALID_CATEGORIES.includes(data.category)) {
      throw new Error(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }

    if (data.status && !VALID_STATUSES.includes(data.status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const product = {
      id: uuidv4(),
      name: data.name,
      sku: data.sku,
      description: data.description || '',
      category: data.category || 'other',
      price: parseFloat(parseFloat(data.price).toFixed(2)),
      stock: parseInt(data.stock, 10),
      status: data.status || 'active',
      createdAt: new Date(),
    };

    products.set(product.id, product);
    return product;
  },

  update: (id, patch) => {
    const product = products.get(id);
    if (!product) return null;

    if (patch.category && !VALID_CATEGORIES.includes(patch.category)) {
      throw new Error(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }

    if (patch.status && !VALID_STATUSES.includes(patch.status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const updatedProduct = {
      ...product,
      ...patch,
      id: product.id,
      createdAt: product.createdAt,
    };

    products.set(id, updatedProduct);
    return updatedProduct;
  },

  delete: (id) => products.delete(id),
};
