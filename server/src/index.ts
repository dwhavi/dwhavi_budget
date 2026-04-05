import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { loadModels, sequelize, db } from './models/index.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

async function setupApp() {
  await loadModels();
  await sequelize.sync();
  
  const { authRouter } = await import('./routes/auth.js');
  app.use('/api/auth', authRouter);
  
  const { paymentMethodsRouter } = await import('./routes/payment-methods.js');
  app.use('/api/payment-methods', paymentMethodsRouter);
  
  const { subcategoriesRouter } = await import('./routes/subcategories.js');
  app.use('/api/subcategories', subcategoriesRouter);
  
  const { categoriesRouter } = await import('./routes/categories.js');
  app.use('/api/categories', categoriesRouter);
  
  const { transactionsRouter } = await import('./routes/transactions.js');
  app.use('/api/transactions', transactionsRouter);
  
  const { recurringExpensesRouter } = await import('./routes/recurring-expenses.js');
  app.use('/api/recurring-expenses', recurringExpensesRouter);
  
  app.use(errorHandler);
  
  return app;
}

async function startServer(): Promise<void> {
  await setupApp();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (!process.env.VITEST) {
  startServer();
}

export { setupApp, db };
export default app;