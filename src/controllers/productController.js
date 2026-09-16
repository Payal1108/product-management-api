import { productModel } from '../models/product.js';
import { catchAsync } from '../middleware/catchAsync.js';

const sendResponse = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data, error: null });

const sendError = (res, error, statusCode = 500) =>
  res.status(statusCode).json({ success: false, data: null, error: error.message || error });

export const productController = {
  /**
   * Retrieves all non-archived products, optionally filtered by query parameters.
   * @param {import("express").Request} req - Express request object containing query filters.
   * @param {import("express").Response} res - Express response object.
   * @param {import("express").NextFunction} next - Express next function.
   * @returns {Promise<void>}
   * @status 200 - Successfully retrieved products.
   * @status 422 - Invalid filter parameters provided.
   */
  getAllProducts: catchAsync(async (req, res, next) => {
    const filters = { ...req.query };
    if (filters.minPrice) filters.minPrice = parseFloat(filters.minPrice);
    if (filters.maxPrice) filters.maxPrice = parseFloat(filters.maxPrice);

    const products = productModel.findAll(filters);
    sendResponse(res, products);
  }),

  /**
   * Retrieves a single product by its unique ID.
   * @param {import("express").Request} req - Express request object containing the product ID in params.
   * @param {import("express").Response} res - Express response object.
   * @param {import("express").NextFunction} next - Express next function.
   * @returns {Promise<void>}
   * @status 200 - Successfully retrieved the product.
   * @status 404 - Product not found or is soft-archived.
   */
  getProductById: catchAsync(async (req, res, next) => {
    const product = productModel.findById(req.params.id);
    if (!product) return sendError(res, 'Product not found', 404);
    sendResponse(res, product);
  }),

  /**
   * Creates a new product.
   * @param {import("express").Request} req - Express request object containing product data in the body.
   * @param {import("express").Response} res - Express response object.
   * @param {import("express").NextFunction} next - Express next function.
   * @returns {Promise<void>}
   * @status 201 - Product created successfully.
   * @status 409 - Product with the provided SKU already exists.
   * @status 422 - Validation error in request body.
   */
  createProduct: catchAsync(async (req, res, next) => {
    try {
      const product = productModel.create(req.body);
      sendResponse(res, product, 201);
    } catch (error) {
      if (error.message === 'Product with this SKU already exists') {
        return sendError(res, error.message, 409);
      }
      throw error;
    }
  }),

  /**
   * Updates specific fields of an existing product.
   * @param {import("express").Request} req - Express request object containing product ID in params and patch data in body.
   * @param {import("express").Response} res - Express response object.
   * @param {import("express").NextFunction} next - Express next function.
   * @returns {Promise<void>}
   * @status 200 - Product updated successfully.
   * @status 400 - Request body is empty.
   * @status 404 - Product not found or is soft-archived.
   * @status 422 - Validation error in patch data.
   */
  updateProduct: catchAsync(async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
      return sendError(res, 'Request body cannot be empty', 400);
    }
    const product = productModel.update(req.params.id, req.body);
    if (!product) return sendError(res, 'Product not found', 404);
    sendResponse(res, product);
  }),

  /**
   * Soft-archives a product.
   * @param {import("express").Request} req - Express request object containing the product ID in params.
   * @param {import("express").Response} res - Express response object.
   * @param {import("express").NextFunction} next - Express next function.
   * @returns {Promise<void>}
   * @status 204 - Product successfully archived.
   * @status 404 - Product not found.
   */
  deleteProduct: catchAsync(async (req, res, next) => {
    const product = productModel.findById(req.params.id);
    if (!product) return sendError(res, 'Product not found', 404);

    const deleted = productModel.delete(req.params.id);
    if (!deleted) return sendError(res, 'Product not found', 404);
    res.status(204).send();
  }),

  /**
   * Restores a soft-archived product.
   * @param {import("express").Request} req - Express request object containing the product ID in params.
   * @param {import("express").Response} res - Express response object.
   * @param {import("express").NextFunction} next - Express next function.
   * @returns {Promise<void>}
   * @status 200 - Product successfully restored.
   * @status 400 - Product is not archived and cannot be restored.
   * @status 404 - Product not found.
   */
  restoreProduct: catchAsync(async (req, res, next) => {
    const restored = productModel.restore(req.params.id);
    if (!restored) return sendError(res, 'Product not found', 404);
    if (restored === 'NOT_ARCHIVED') return sendError(res, 'Product is not archived', 400);
    sendResponse(res, { message: 'Product restored successfully' });
  }),
};
