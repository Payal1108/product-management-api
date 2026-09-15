import { productModel } from '../models/product.js';

const sendResponse = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data, error: null });

const sendError = (res, error, statusCode = 500) =>
  res.status(statusCode).json({ success: false, data: null, error: error.message || error });

export const productController = {
  getAllProducts: async (req, res, next) => {
    try {
      const products = productModel.findAll(req.query);
      sendResponse(res, products);
    } catch (error) {
      next(error);
    }
  },

  getProductById: async (req, res, next) => {
    try {
      const product = productModel.findById(req.params.id);
      if (!product) return sendError(res, 'Product not found', 404);
      sendResponse(res, product);
    } catch (error) {
      next(error);
    }
  },

  createProduct: async (req, res, next) => {
    try {
      const { name, sku, price, stock } = req.body;
      if (!name || !sku || price === undefined || stock === undefined) {
        return sendError(res, 'Missing required fields: name, sku, price, stock', 400);
      }

      if (price <= 0) return sendError(res, 'Price must be a positive number', 400);
      if (stock < 0) return sendError(res, 'Stock cannot be negative', 400);

      const product = productModel.create(req.body);
      sendResponse(res, product, 201);
    } catch (error) {
      next(error);
    }
  },

  updateProduct: async (req, res, next) => {
    try {
      const product = productModel.update(req.params.id, req.body);
      if (!product) return sendError(res, 'Product not found', 404);
      sendResponse(res, product);
    } catch (error) {
      next(error);
    }
  },

  deleteProduct: async (req, res, next) => {
    try {
      const deleted = productModel.delete(req.params.id);
      if (!deleted) return sendError(res, 'Product not found', 404);
      sendResponse(res, { message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
