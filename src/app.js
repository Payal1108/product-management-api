import express from 'express';
import productRoutes from './routes/products.js';
import { errorHandler } from './middleware/errorHandler.js';

const createApp = () => {
  const app = express();

  app.use(express.json());

  app.use('/products', productRoutes);

  // 404 handler
  app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.statusCode = 404;
    next(error);
  });

  app.use(errorHandler);

  return app;
};

export default createApp;
