import { body, query } from 'express-validator';

const VALID_CATEGORIES = ['electronics', 'clothing', 'food', 'books', 'other'];
const VALID_STATUSES = ['active', 'inactive', 'discontinued'];

export const validateCreate = [
  body('name').notEmpty().withMessage('Missing required fields: name, sku, price, stock'),
  body('sku').notEmpty().withMessage('Missing required fields: name, sku, price, stock'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock cannot be negative'),
  body('category').optional().isIn(VALID_CATEGORIES).withMessage(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`),
  body('status').optional().isIn(VALID_STATUSES).withMessage(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`),
];

export const validateUpdate = [
  body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock cannot be negative'),
  body('category').optional().isIn(VALID_CATEGORIES).withMessage(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`),
  body('status').optional().isIn(VALID_STATUSES).withMessage(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`),
];

export const validateFilters = [
  query('category').optional().isIn(VALID_CATEGORIES).withMessage(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`),
  query('status').optional().isIn(VALID_STATUSES).withMessage(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`),
  query('minPrice').optional().isFloat().withMessage('minPrice must be a number'),
  query('maxPrice').optional().isFloat().withMessage('maxPrice must be a number'),
  query('inStock').optional().isBoolean().withMessage('inStock must be true or false'),
];
