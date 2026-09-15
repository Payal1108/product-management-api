import express from 'express';
import { productController } from '../controllers/productController.js';
import { validateCreate, validateUpdate, validateFilters } from '../validators/productValidator.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/', validateFilters, validate, productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', validateCreate, validate, productController.createProduct);
router.patch('/:id', validateUpdate, validate, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.delete('/:id/restore', productController.restoreProduct);

export default router;
