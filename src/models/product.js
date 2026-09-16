import { v4 as uuidv4 } from 'uuid';

const products = new Map();

const VALID_CATEGORIES = ['electronics', 'clothing', 'food', 'books', 'other'];
const VALID_STATUSES = ['active', 'inactive', 'discontinued'];

export const productModel = {
  /**
   * Retrieves a list of products based on optional filter criteria.
   * @param {Object} [filters={}] - Filter options including category, status, price range, stock, and search term.
   * @returns {Array<Object>} A list of products that match the filters and are not soft-archived.
   * @note Business Rule: Only products where archivedAt is null are returned.
   */
  findAll: (filters = {}) => {
    const { category, status, minPrice, maxPrice, inStock, search } = filters;
    let result = Array.from(products.values()).filter(p => p.archivedAt === null);

    if (category) result = result.filter(p => p.category === category);
    if (status) result = result.filter(p => p.status === status);
    if (minPrice !== undefined) result = result.filter(p => p.price >= minPrice);
    if (maxPrice !== undefined) result = result.filter(p => p.price <= maxPrice);
    if (inStock !== undefined) {
      const shouldBeInStock = inStock === true || inStock === 'true';
      result = result.filter(p => shouldBeInStock ? p.stock > 0 : p.stock === 0);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
    }
    return result;
  },

  /**
   * Retrieves a specific product by its unique identifier.
   * @param {string} id - The UUID of the product.
   * @returns {Object|null} The product object, or null if the ID is unknown or the product is soft-archived.
   * @note Business Rule: Returns null for soft-archived products to treat them as deleted.
   */
  findById: (id) => {
    const product = products.get(id);
    if (!product || product.archivedAt !== null) return null;
    return product;
  },

  /**
   * Retrieves a product using its Stock Keeping Unit (SKU).
   * @param {string} sku - The unique SKU of the product.
   * @returns {Object|null} The product object, or null if no product matches the SKU.
   * @note Business Rule: SKUs must be unique across the entire product catalogue.
   */
  findBySku: (sku) => Array.from(products.values()).find(p => p.sku === sku) || null,

  /**
   * Creates and persists a new product in the store.
   * @param {Object} data - Product details including name, sku, price, stock, and optional category/status.
   * @returns {Object} The created product object with generated id and createdAt date.
   * @throws {Error} If name or sku is missing, price is non-positive, or the SKU already exists.
   * @note Business Rule: Defaults status to 'active' and archivedAt to null.
   */
  create: (data) => {
    if (!data.name) {
      throw new Error('Product name is required');
    }
    if (!data.sku) {
      throw new Error('Product SKU is required');
    }
    if (isNaN(data.price) || parseFloat(data.price) <= 0) {
      throw new Error('Product price must be a positive number');
    }
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
      archivedAt: null,
      createdAt: new Date(),
    };

    products.set(product.id, product);
    return product;
  },

  /**
   * Updates an existing product's attributes.
   * @param {string} id - The UUID of the product to update.
   * @param {Object} patch - An object containing the fields to be updated.
   * @returns {Object|null} The updated product object, or null if the product is not found or is archived.
   * @throws {Error} If a provided category or status is not in the allowed list.
   * @note Business Rule: The id, sku, and createdAt fields are immutable and cannot be modified.
   */
  update: (id, patch) => {
    const product = products.get(id);
    if (!product || product.archivedAt !== null) return null;

    if (patch.category && !VALID_CATEGORIES.includes(patch.category)) {
      throw new Error(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }

    if (patch.status && !VALID_STATUSES.includes(patch.status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    // Filter out unknown fields and protected fields
    const allowedFields = ['name', 'description', 'category', 'price', 'stock', 'status'];
    const filteredPatch = {};
    for (const key of Object.keys(patch)) {
      if (allowedFields.includes(key)) {
        filteredPatch[key] = patch[key];
      }
    }

    const updatedProduct = {
      ...product,
      ...filteredPatch,
      id: product.id,
      sku: product.sku,
      createdAt: product.createdAt,
    };

    products.set(id, updatedProduct);
    return updatedProduct;
  },

  /**
   * Soft-archives a product by marking it with a deletion timestamp.
   * @param {string} id - The UUID of the product to archive.
   * @returns {boolean} True if the product was successfully archived, false if it was not found.
   * @note Business Rule: Soft-archive preserves the record in the store but excludes it from standard lookups.
   */
  delete: (id) => {
    const product = products.get(id);
    if (!product) return false;
    product.archivedAt = new Date();
    products.set(id, product);
    return true;
  },

  /**
   * Restores a previously soft-archived product to active status.
   * @param {string} id - The UUID of the product to restore.
   * @returns {boolean|string} True if restored, false if not found, or 'NOT_ARCHIVED' if the product is already active.
   * @note Business Rule: Clears the archivedAt timestamp to make the product visible in findAll.
   */
  restore: (id) => {
    const product = products.get(id);
    if (!product) return false;
    if (product.archivedAt === null) return 'NOT_ARCHIVED';
    product.archivedAt = null;
    products.set(id, product);
    return true;
  },

  /**
   * Completely clears all products from the in-memory store.
   * @returns {void}
   * @note This method is intended for use in test environments to ensure isolation between test cases.
   */
  clearStore: () => {
    products.clear();
  },
};
