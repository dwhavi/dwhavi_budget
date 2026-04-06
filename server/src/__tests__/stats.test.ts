import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Application } from 'express';
import type { ModelRegistry } from '../models/index.js';

let app: Application;
let db: ModelRegistry;

const defaultCategories = [
  { name: '급여', type: 'income' as const, icon: '💰', color: '#22c55e', sort_order: 1 },
  { name: '부수입', type: 'income' as const, icon: '💼', color: '#3b82f6', sort_order: 2 },
  { name: '용돈', type: 'income' as const, icon: '🎁', color: '#a855f7', sort_order: 3 },
  { name: '식비', type: 'expense' as const, icon: '🍽️', color: '#ef4444', sort_order: 4 },
  { name: '교통', type: 'expense' as const, icon: '🚌', color: '#f97316', sort_order: 5 },
  { name: '주거', type: 'expense' as const, icon: '🏠', color: '#8b5cf6', sort_order: 6 },
  { name: '통신', type: 'expense' as const, icon: '📱', color: '#06b6d4', sort_order: 7 },
  { name: '유흥', type: 'expense' as const, icon: '🎮', color: '#ec4899', sort_order: 8 },
  { name: '쇼핑', type: 'expense' as const, icon: '🛍️', color: '#f59e0b', sort_order: 9 },
  { name: '의료', type: 'expense' as const, icon: '🏥', color: '#14b8a6', sort_order: 10 },
  { name: '교육', type: 'expense' as const, icon: '📚', color: '#6366f1', sort_order: 11 },
  { name: '기타', type: 'expense' as const, icon: '📌', color: '#64748b', sort_order: 12 },
];

const testUser = {
  email: 'stats-test@example.com',
  password: 'Password123',
  display_name: 'Stats Tester',
};

beforeAll(async () => {
  const { setupApp } = await import('../index.js');
  app = await setupApp();
  const { db: dbRegistry } = await import('../models/index.js');
  db = dbRegistry;
});

async function createTestUser(userData: typeof testUser = testUser) {
  return await db.User.create({
    ...userData,
    password_hash: await bcrypt.hash(userData.password, 10),
  });
}

function generateAccessToken(user: { id: number; email: string; role: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'dev-secret-change-in-production',
    { expiresIn: '15m' },
  );
}

async function seedGlobalCategories() {
  await db.Category.bulkCreate(
    defaultCategories.map((cat) => ({ ...cat, user_id: null })),
  );
}

async function createTestPaymentMethods(userId: number) {
  await db.PaymentMethod.bulkCreate([
    {
      user_id: userId,
      name: '현금',
      type: 'cash',
      color: '#22c55e',
      is_default: true,
    },
    {
      user_id: userId,
      name: '신용카드',
      issuer: '삼성카드',
      type: 'credit',
      color: '#3b82f6',
      is_default: false,
    },
  ]);
}

describe('Stats API', () => {
  let accessToken: string;
  let userId: number;

  beforeEach(async () => {
    await db.Transaction.destroy({ where: {} });
    await db.Budget.destroy({ where: {} });
    await db.Category.destroy({ where: {} });
    await db.PaymentMethod.destroy({ where: {} });
    await db.User.destroy({ where: {} });

    await seedGlobalCategories();
    const user = await createTestUser();
    userId = user.id;
    accessToken = generateAccessToken(user);
    await createTestPaymentMethods(userId);
  });

  afterEach(async () => {
    await db.Transaction.destroy({ where: {} });
    await db.Budget.destroy({ where: {} });
    await db.Category.destroy({ where: {} });
    await db.PaymentMethod.destroy({ where: {} });
    await db.User.destroy({ where: {} });
  });

  describe('GET /api/stats/dashboard?month=YYYY-MM', () => {
    it('returns dashboard summary with all required fields', async () => {
      const incomeCategory = (await db.Category.findOne({ where: { name: '급여', user_id: null } }))!;
      const expenseCategory = (await db.Category.findOne({ where: { name: '식비', user_id: null } }))!;
      const paymentMethod = (await db.PaymentMethod.findOne({ where: { name: '현금', user_id: userId } }))!;

      await db.Transaction.create({
        user_id: userId,
        type: 'income',
        amount: 3000000,
        category_id: incomeCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2026-04-01',
      });

      await db.Transaction.create({
        user_id: userId,
        type: 'expense',
        amount: 500000,
        category_id: expenseCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2026-04-05',
      });

      await db.Transaction.create({
        user_id: userId,
        type: 'expense',
        amount: 300000,
        category_id: expenseCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2026-04-10',
      });

      const response = await request(app)
        .get('/api/stats/dashboard?month=2026-04')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const data = response.body.data;
      
      expect(data).toHaveProperty('totalIncome');
      expect(data).toHaveProperty('totalExpense');
      expect(data).toHaveProperty('balance');
      expect(data).toHaveProperty('dailyAllowance');
      expect(data).toHaveProperty('categoryRanking');
      expect(data).toHaveProperty('recentTransactions');

      expect(data.totalIncome).toBe(3000000);
      expect(data.totalExpense).toBe(800000);
      expect(data.balance).toBe(2200000);
      
      expect(data.dailyAllowance).toBeGreaterThan(0);
      
      expect(data.categoryRanking).toHaveLength(1);
      expect(data.categoryRanking[0]).toEqual({
        category_id: expenseCategory.id,
        category_name: '식비',
        total: 800000,
        color: '#ef4444',
      });

      expect(data.recentTransactions).toHaveLength(3);
      expect(data.recentTransactions[0].date).toBe('2026-04-10');
      expect(data.recentTransactions[1].date).toBe('2026-04-05');
      expect(data.recentTransactions[2].date).toBe('2026-04-01');
    });

    it('returns all zeros and empty arrays for empty month', async () => {
      const response = await request(app)
        .get('/api/stats/dashboard?month=2026-04')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const data = response.body.data;
      
      expect(data.totalIncome).toBe(0);
      expect(data.totalExpense).toBe(0);
      expect(data.balance).toBe(0);
      expect(data.dailyAllowance).toBe(0);
      expect(data.categoryRanking).toEqual([]);
      expect(data.recentTransactions).toEqual([]);
    });

    it('returns 401 without auth', async () => {
      await request(app)
        .get('/api/stats/dashboard?month=2026-04')
        .expect(401);
    });

    it('scopes data to authenticated user only', async () => {
      const otherUser = await db.User.create({
        email: 'other-stats@example.com',
        password_hash: await bcrypt.hash('Password123', 10),
        display_name: 'Other User',
      });
      const otherToken = generateAccessToken(otherUser);
      await createTestPaymentMethods(otherUser.id);

      const incomeCategory = (await db.Category.findOne({ where: { name: '급여', user_id: null } }))!;
      const paymentMethod = (await db.PaymentMethod.findOne({ where: { name: '현금', user_id: userId } }))!;
      const otherPaymentMethod = (await db.PaymentMethod.findOne({ where: { name: '현금', user_id: otherUser.id } }))!;

      await db.Transaction.create({
        user_id: userId,
        type: 'income',
        amount: 3000000,
        category_id: incomeCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2026-04-01',
      });

      await db.Transaction.create({
        user_id: otherUser.id,
        type: 'income',
        amount: 1000000,
        category_id: incomeCategory.id,
        payment_method_id: otherPaymentMethod.id,
        date: '2026-04-01',
      });

      const response = await request(app)
        .get('/api/stats/dashboard?month=2026-04')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.totalIncome).toBe(3000000);

      const otherResponse = await request(app)
        .get('/api/stats/dashboard?month=2026-04')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(otherResponse.body.data.totalIncome).toBe(1000000);
    });
  });

  describe('GET /api/stats/monthly-trend', () => {
    it('returns last 6 months income vs expense trend', async () => {
      const incomeCategory = (await db.Category.findOne({ where: { name: '급여', user_id: null } }))!;
      const expenseCategory = (await db.Category.findOne({ where: { name: '식비', user_id: null } }))!;
      const paymentMethod = (await db.PaymentMethod.findOne({ where: { name: '현금', user_id: userId } }))!;

      await db.Transaction.create({
        user_id: userId,
        type: 'income',
        amount: 3000000,
        category_id: incomeCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2026-04-01',
      });

      await db.Transaction.create({
        user_id: userId,
        type: 'expense',
        amount: 500000,
        category_id: expenseCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2026-04-05',
      });

      await db.Transaction.create({
        user_id: userId,
        type: 'income',
        amount: 2800000,
        category_id: incomeCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2026-03-01',
      });

      await db.Transaction.create({
        user_id: userId,
        type: 'expense',
        amount: 450000,
        category_id: expenseCategory.id,
        payment_method_id: paymentMethod.id,
        date: '2026-03-10',
      });

      const response = await request(app)
        .get('/api/stats/monthly-trend')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const data = response.body.data;
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      const monthData = data[0];
      expect(monthData).toHaveProperty('month');
      expect(monthData).toHaveProperty('income');
      expect(monthData).toHaveProperty('expense');
    });

    it('returns months with zero income/expense when no transactions', async () => {
      const response = await request(app)
        .get('/api/stats/monthly-trend')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const data = response.body.data;
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(6);
      
      data.forEach((month: { income: number; expense: number }) => {
        expect(month.income).toBe(0);
        expect(month.expense).toBe(0);
      });
    });

    it('returns 401 without auth', async () => {
      await request(app)
        .get('/api/stats/monthly-trend')
        .expect(401);
    });
  });

  describe('GET /api/stats/category?month=YYYY-MM', () => {
    it('returns expense category breakdown for the month', async () => {
      const expenseCategory1 = (await db.Category.findOne({ where: { name: '식비', user_id: null } }))!;
      const expenseCategory2 = (await db.Category.findOne({ where: { name: '교통', user_id: null } }))!;
      const paymentMethod = (await db.PaymentMethod.findOne({ where: { name: '현금', user_id: userId } }))!;

      await db.Transaction.create({
        user_id: userId,
        type: 'expense',
        amount: 500000,
        category_id: expenseCategory1.id,
        payment_method_id: paymentMethod.id,
        date: '2026-04-05',
      });

      await db.Transaction.create({
        user_id: userId,
        type: 'expense',
        amount: 300000,
        category_id: expenseCategory1.id,
        payment_method_id: paymentMethod.id,
        date: '2026-04-10',
      });

      await db.Transaction.create({
        user_id: userId,
        type: 'expense',
        amount: 200000,
        category_id: expenseCategory2.id,
        payment_method_id: paymentMethod.id,
        date: '2026-04-15',
      });

      const response = await request(app)
        .get('/api/stats/category?month=2026-04')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const data = response.body.data;
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      
      const categoryData = data[0];
      expect(categoryData).toHaveProperty('category_id');
      expect(categoryData).toHaveProperty('category_name');
      expect(categoryData).toHaveProperty('total');
      expect(categoryData).toHaveProperty('percentage');
      expect(categoryData).toHaveProperty('color');
       
      const totalPercentage = data.reduce((sum: number, item: { percentage: number }) => sum + item.percentage, 0);
      expect(Math.abs(totalPercentage - 100)).toBeLessThan(0.01);
    });
  });

  describe('GET /api/stats/payment-methods?month=YYYY-MM', () => {
    it('returns payment method breakdown for the month', async () => {
      const cashMethod = (await db.PaymentMethod.findOne({ where: { name: '현금', user_id: userId } }))!;
      const creditMethod = (await db.PaymentMethod.findOne({ where: { name: '신용카드', user_id: userId } }))!;
      const expenseCategory = (await db.Category.findOne({ where: { name: '식비', user_id: null } }))!;

      await db.Transaction.create({
        user_id: userId,
        type: 'expense',
        amount: 500000,
        category_id: expenseCategory.id,
        payment_method_id: cashMethod.id,
        date: '2026-04-05',
      });

      await db.Transaction.create({
        user_id: userId,
        type: 'expense',
        amount: 300000,
        category_id: expenseCategory.id,
        payment_method_id: cashMethod.id,
        date: '2026-04-10',
      });

      await db.Transaction.create({
        user_id: userId,
        type: 'expense',
        amount: 200000,
        category_id: expenseCategory.id,
        payment_method_id: creditMethod.id,
        date: '2026-04-15',
      });

      const response = await request(app)
        .get('/api/stats/payment-methods?month=2026-04')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const data = response.body.data;
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      
      const paymentMethodData = data[0];
      expect(paymentMethodData).toHaveProperty('payment_method_id');
      expect(paymentMethodData).toHaveProperty('payment_method_name');
      expect(paymentMethodData).toHaveProperty('total');
      expect(paymentMethodData).toHaveProperty('percentage');
       
      const totalPercentage = data.reduce((sum: number, item: { percentage: number }) => sum + item.percentage, 0);
      expect(Math.abs(totalPercentage - 100)).toBeLessThan(0.01);
    });

    it('returns empty array for month with no transactions', async () => {
      const response = await request(app)
        .get('/api/stats/payment-methods?month=2026-04')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('returns 401 without auth', async () => {
      await request(app)
        .get('/api/stats/payment-methods?month=2026-04')
        .expect(401);
    });
  });
});