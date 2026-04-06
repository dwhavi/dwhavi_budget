import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Application } from 'express';
import type { ModelRegistry } from '../models/index.js';
import type { Sequelize } from 'sequelize';
import type { Category } from '../models/Category.js';
import type { PaymentMethod } from '../models/PaymentMethod.js';
import type { Transaction } from '../models/Transaction.js';

let app: Application;
let db: ModelRegistry;
let sequelize: Sequelize;

interface TestUserData {
  email: string;
  password: string;
  display_name: string;
}

interface TestCategoryData {
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  user_id: number | null;
  sort_order: number;
}

interface TestPaymentMethodData {
  user_id: number;
  name: string;
  type: 'credit' | 'debit' | 'cash' | 'transfer';
  is_default?: boolean;
}

interface TestTransactionData {
  user_id: number;
  type: 'income' | 'expense';
  amount: number;
  category_id: number;
  payment_method_id?: number | null;
  date: string;
  sub_category?: string | null;
  memo?: string | null;
  deleted_at?: Date | null;
}

beforeAll(async () => {
  const { setupApp } = await import('../index.js');
  app = await setupApp();
  const { db: dbRegistry, sequelize: sequelizeInstance } = await import('../models/index.js');
  db = dbRegistry;
  sequelize = sequelizeInstance;
});

async function createTestUser(userData: TestUserData = testUser) {
  return await db.User.create({
    ...userData,
    password_hash: await bcrypt.hash(userData.password, 10),
  });
}

async function createTestCategory(categoryData: TestCategoryData): Promise<Category> {
  return await db.Category.create(categoryData);
}

async function createTestPaymentMethod(paymentMethodData: TestPaymentMethodData): Promise<PaymentMethod> {
  return await db.PaymentMethod.create(paymentMethodData);
}

async function createTestTransaction(transactionData: TestTransactionData): Promise<Transaction> {
  return await db.Transaction.create(transactionData);
}

const testUser = {
  email: 'test@example.com',
  password: 'Password123',
  display_name: 'Test User',
};

describe('Transactions API', () => {
  let accessToken: string;
  let userId: number;
  let incomeCategory: Category;
  let expenseCategory: Category;
  let paymentMethod: PaymentMethod;

  beforeAll(async () => {
    await loadModels();
  });

  beforeEach(async () => {
    await db.Transaction.destroy({ where: {} });
    await db.PaymentMethod.destroy({ where: {} });
    await db.Category.destroy({ where: {} });
    await db.User.destroy({ where: {} });

    const user = await createTestUser();
    userId = user.id;

    accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret-change-in-production',
      { expiresIn: '15m' }
    );

    incomeCategory = await createTestCategory({
      user_id: userId,
      name: '월급',
      type: 'income',
      icon: '💰',
      color: '#4CAF50',
      sort_order: 0,
    });

    expenseCategory = await createTestCategory({
      user_id: userId,
      name: '식비',
      type: 'expense',
      icon: '🍔',
      color: '#F44336',
      sort_order: 0,
    });

    paymentMethod = await createTestPaymentMethod({
      user_id: userId,
      name: '체크카드',
      type: 'debit',
      is_default: false,
    });
  });

  afterEach(async () => {
    await db.Transaction.destroy({ where: {} });
    await db.PaymentMethod.destroy({ where: {} });
    await db.Category.destroy({ where: {} });
    await db.User.destroy({ where: {} });
  });

  describe('POST /api/transactions', () => {
    it('1. should create income transaction with valid data', async () => {
      const transactionData = {
        type: 'income',
        amount: 3000000,
        category_id: incomeCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2024-01-15',
        memo: '1월 월급',
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transaction');
      expect(response.body.data.transaction.type).toBe('income');
      expect(response.body.data.transaction.amount).toBe(3000000);
      expect(response.body.data.transaction.memo).toBe('1월 월급');
    });

    it('2. should create expense transaction with valid data', async () => {
      const transactionData = {
        type: 'expense',
        amount: 15000,
        category_id: expenseCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2024-01-15',
        sub_category: '점심',
        memo: '김치찌개',
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transaction');
      expect(response.body.data.transaction.type).toBe('expense');
      expect(response.body.data.transaction.amount).toBe(15000);
      expect(response.body.data.transaction.sub_category).toBe('점심');
      expect(response.body.data.transaction.memo).toBe('김치찌개');
    });

    it('3. should return 400 when creating income transaction with expense category', async () => {
      const transactionData = {
        type: 'income',
        amount: 3000000,
        category_id: expenseCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2024-01-15',
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(transactionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('수입 카테고리만 선택할 수 있습니다');
    });

    it('4. should return 400 when amount is 0', async () => {
      const transactionData = {
        type: 'income',
        amount: 0,
        category_id: incomeCategory.id,
        date: '2024-01-15',
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(transactionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('5. should return 400 when amount is 100000000', async () => {
      const transactionData = {
        type: 'income',
        amount: 100000000,
        category_id: incomeCategory.id,
        date: '2024-01-15',
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(transactionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/transactions', () => {
    beforeEach(async () => {
      await createTestTransaction({
        user_id: userId,
        type: 'income',
        amount: 3000000,
        category_id: incomeCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2024-01-15',
        memo: '1월 월급',
      });

      await createTestTransaction({
        user_id: userId,
        type: 'expense',
        amount: 15000,
        category_id: expenseCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2024-01-15',
        sub_category: '점심',
        memo: '김치찌개',
      });

      await createTestTransaction({
        user_id: userId,
        type: 'expense',
        amount: 50000,
        category_id: expenseCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2024-01-20',
        memo: '마트 장보기',
      });
    });

    it('6. should return paginated results for month filter', async () => {
      const response = await request(app)
        .get('/api/transactions?month=2024-01')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transactions');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.transactions).toHaveLength(3);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('7. should return transactions for specific date', async () => {
      const response = await request(app)
        .get('/api/transactions?date=2024-01-15')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(2);
      expect(response.body.data.transactions.every((t: { date: string }) => t.date === '2024-01-15')).toBe(true);
    });

    it('8. should return filtered and sorted results', async () => {
      const response = await request(app)
        .get('/api/transactions?category_id=' + expenseCategory.id + '&min_amount=10000&sort=amount&order=desc')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(2);
      expect(response.body.data.transactions[0].amount).toBe(50000);
      expect(response.body.data.transactions[1].amount).toBe(15000);
    });

    it('9. should return paginated results with limit', async () => {
      const response = await request(app)
        .get('/api/transactions?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.total).toBe(3);
      expect(response.body.data.pagination.totalPages).toBe(2);
      expect(response.body.data.transactions).toHaveLength(2);
    });

    it('14. should return transactions with keyword search', async () => {
      const response = await request(app)
        .get('/api/transactions?keyword=김치')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(1);
      expect(response.body.data.transactions[0].memo).toBe('김치찌개');
    });
  });

  describe('PUT /api/transactions/:id', () => {
    let transactionId: number;

    beforeEach(async () => {
      const transaction = await createTestTransaction({
        user_id: userId,
        type: 'expense',
        amount: 15000,
        category_id: expenseCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2024-01-15',
        memo: '점심',
      });
      transactionId = transaction.id;
    });

    it('10. should update own transaction', async () => {
      const updateData = {
        amount: 20000,
        memo: '특별한 점심',
      };

      const response = await request(app)
        .put(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.amount).toBe(20000);
      expect(response.body.data.transaction.memo).toBe('특별한 점심');
    });

    it('11. should return 403 when updating other user transaction', async () => {
      const otherUser = await createTestUser({
        email: 'other@example.com',
        password: 'Password123',
        display_name: 'Other User',
      });

      const otherTransaction = await createTestTransaction({
        user_id: otherUser.id,
        type: 'expense',
        amount: 10000,
        category_id: expenseCategory.id,
        date: '2024-01-15',
      });

      const updateData = {
        amount: 20000,
      };

      const response = await request(app)
        .put(`/api/transactions/${otherTransaction.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('거래 내역을 찾을 수 없습니다');
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    let transactionId: number;

    beforeEach(async () => {
      const transaction = await createTestTransaction({
        user_id: userId,
        type: 'expense',
        amount: 15000,
        category_id: expenseCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2024-01-15',
        memo: '점심',
      });
      transactionId = transaction.id;
    });

    it('12. should soft delete transaction', async () => {
      const response = await request(app)
        .delete(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('거래 내역이 삭제되었습니다');

      const getResponse = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.data.transactions).toHaveLength(0);
    });
  });

  describe('PATCH /api/transactions/:id/restore', () => {
    let transactionId: number;

    beforeEach(async () => {
      const transaction = await createTestTransaction({
        user_id: userId,
        type: 'expense',
        amount: 15000,
        category_id: expenseCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2024-01-15',
        memo: '점심',
        deleted_at: new Date(),
      });
      transactionId = transaction.id;
    });

    it('13. should restore soft-deleted transaction', async () => {
      const response = await request(app)
        .patch(`/api/transactions/${transactionId}/restore`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.deleted_at).toBeNull();

      const getResponse = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.data.transactions).toHaveLength(1);
    });
  });
});

async function loadModels() {
  if (db.User) {
    return;
  }

  const userModel = await import('../models/User.js');
  const categoryModel = await import('../models/Category.js');
  const transactionModel = await import('../models/Transaction.js');
  const paymentMethodModel = await import('../models/PaymentMethod.js');

  db.User = userModel.User;
  db.Category = categoryModel.Category;
  db.Transaction = transactionModel.Transaction;
  db.PaymentMethod = paymentMethodModel.PaymentMethod;

  await sequelize.sync({ force: true });
}