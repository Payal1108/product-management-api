import { productModel } from '../models/product.js';
import { catchAsync } from '../middleware/catchAsync.js';

const sendResponse = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data, error: null });

const sendError = (res, error, statusCode = 500) =>
  res.status(statusCode).json({ success: false, data: null, error: error.message || error });

export const productController = {
  getAllProducts: catchAsync(async (req, res, next) => {
    const filters = { ...req.query };
    if (filters.minPrice) filters.minPrice = parseFloat(filters.minPrice);
    if (filters.maxPrice) filters.maxPrice = parseFloat(filters.maxPrice);

    const products = productModel.findAll(filters);
    sendResponse(res, products);
  }),

  getProductById: catchAsync(async (req, res, next) => {
    const product = productModel.findById(req.params.id);
    if (!product) return sendError(res, 'Product not found', 404);
    sendResponse(res, product);
  }),

  createProduct: catchAsync(async (req, res, next) => {
    const product = productModel.create(req.body);
    sendResponse(res, product, 201);
  }),

  updateProduct: catchAsync(async (req, res, next) => {
    const product = productModel.update(req.params.id, req.body);
    if (!product) return sendError(res, 'Product not found', 404);
    sendResponse(res, product);
  }),

  deleteProduct: catchAsync(async (req, res, next) => {
    const product = productModel.findById(req.params.id);
    if (!product) return sendError(res, 'Product not found', 404);

    const deleted = productModel.delete(req.params.id);
    if (!deleted) return sendError(res, 'Product not found', 404);
    sendResponse(res, { message: 'Product deleted successfully' });
  }),

  restoreProduct: catchAsync(async (req, res, next) => {
    const restored = productModel.restore(req.params.id);
    if (!restored) return sendError(res, 'Product not found', 404);
    sendResponse(res, { message: 'Product restored successfully' });
  }),
};
