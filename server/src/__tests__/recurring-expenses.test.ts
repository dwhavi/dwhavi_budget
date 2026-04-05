import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

let app: any;
let db: any;
let sequelize: any;

beforeAll(async () => {
  const { setupApp } = await import('../index.js');
  app = await setupApp();
  const { db: dbRegistry, sequelize: seq } = await import('../models/index.js');
  db = dbRegistry;
  sequelize = seq;
  await sequelize.sync();
});

async function createTestUser() {
  return await db.User.create({
    email: 're-test@example.com',
    password_hash: await bcrypt.hash('Password123', 10),
    display_name: 'RE Test User',
    role: 'user',
  });
}

function generateToken(user: { id: number; email: string; role: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'dev-secret-change-in-production',
    { expiresIn: '15m' },
  );
}

async function seedCategoryAndPaymentMethod(userId: number) {
  const category = await db.Category.create({
    user_id: userId,
    name: '식비',
    type: 'expense',
    icon: '🍔',
    color: '#FF0000',
  });
  const paymentMethod = await db.PaymentMethod.create({
    user_id: userId,
    name: '신용카드',
    type: 'credit',
    is_default: false,
  });
  return { category, paymentMethod };
}

describe('RecurringExpenses API', () => {
  let token: string;
  let userId: number;
  let categoryId: number;
  let paymentMethodId: number;

  beforeEach(async () => {
    await db.RecurringExpense.destroy({ where: {}, force: true });
    await db.Category.destroy({ where: {} });
    await db.PaymentMethod.destroy({ where: {} });
    await db.User.destroy({ where: {} });

    const user = await createTestUser();
    userId = user.id;
    token = generateToken(user);

    const { category, paymentMethod } = await seedCategoryAndPaymentMethod(userId);
    categoryId = category.id;
    paymentMethodId = paymentMethod.id;
  });

  describe('GET /api/recurring-expenses', () => {
    it('1. returns empty list initially', async () => {
      const response = await request(app)
        .get('/api/recurring-expenses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.expenses).toEqual([]);
    });
  });

  describe('POST /api/recurring-expenses', () => {
    it('2. creates a recurring expense with start_date and end_date', async () => {
      const response = await request(app)
        .post('/api/recurring-expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '넷플릭스',
          amount: 15000,
          category_id: categoryId,
          payment_method_id: paymentMethodId,
          start_date: '2026-01-01',
          end_date: '2026-12-31',
          memo: '월 구독',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.expense.name).toBe('넷플릭스');
      expect(response.body.data.expense.amount).toBe(15000);
      expect(response.body.data.expense.start_date).toBe('2026-01-01');
      expect(response.body.data.expense.end_date).toBe('2026-12-31');
      expect(response.body.data.expense.is_active).toBe(true);
      expect(response.body.data.expense.user_id).toBe(userId);
    });
  });

  describe('PUT /api/recurring-expenses/:id', () => {
    it('3. updates a recurring expense', async () => {
      const expense = await db.RecurringExpense.create({
        user_id: userId,
        name: '넷플릭스',
        amount: 15000,
        category_id: categoryId,
        payment_method_id: paymentMethodId,
        start_date: '2026-01-01',
      });

      const response = await request(app)
        .put(`/api/recurring-expenses/${expense.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 17000, name: '넷플릭스 프리미엄' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.expense.amount).toBe(17000);
      expect(response.body.data.expense.name).toBe('넷플릭스 프리미엄');
    });
  });

  describe('DELETE /api/recurring-expenses/:id', () => {
    it('4. soft deletes a recurring expense', async () => {
      const expense = await db.RecurringExpense.create({
        user_id: userId,
        name: '넷플릭스',
        amount: 15000,
        category_id: categoryId,
        payment_method_id: paymentMethodId,
        start_date: '2026-01-01',
      });

      const response = await request(app)
        .delete(`/api/recurring-expenses/${expense.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const found = await db.RecurringExpense.findByPk(expense.id);
      expect(found.deleted_at).not.toBeNull();

      const listRes = await request(app)
        .get('/api/recurring-expenses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(listRes.body.data.expenses).toHaveLength(0);
    });
  });

  describe('PATCH /api/recurring-expenses/:id/toggle', () => {
    it('5. toggles is_active field', async () => {
      const expense = await db.RecurringExpense.create({
        user_id: userId,
        name: '넷플릭스',
        amount: 15000,
        category_id: categoryId,
        payment_method_id: paymentMethodId,
        start_date: '2026-01-01',
      });

      expect(expense.is_active).toBe(true);

      const toggleRes = await request(app)
        .patch(`/api/recurring-expenses/${expense.id}/toggle`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(toggleRes.body.success).toBe(true);
      expect(toggleRes.body.data.expense.is_active).toBe(false);

      const toggleRes2 = await request(app)
        .patch(`/api/recurring-expenses/${expense.id}/toggle`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(toggleRes2.body.data.expense.is_active).toBe(true);
    });
  });

  describe('GET /api/recurring-expenses/month-summary', () => {
    it('6. calculates only active expenses within period', async () => {
      await db.RecurringExpense.create({
        user_id: userId,
        name: '넷플릭스',
        amount: 15000,
        category_id: categoryId,
        payment_method_id: paymentMethodId,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        is_active: true,
      });
      await db.RecurringExpense.create({
        user_id: userId,
        name: 'spotify',
        amount: 10000,
        category_id: categoryId,
        payment_method_id: paymentMethodId,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        is_active: true,
      });

      const response = await request(app)
        .get('/api/recurring-expenses/month-summary?month=2026-04')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalAmount).toBe(25000);
      expect(response.body.data.count).toBe(2);
    });

    it('7. excludes expenses where end_date < month-start', async () => {
      await db.RecurringExpense.create({
        user_id: userId,
        name: '과거 구독',
        amount: 5000,
        category_id: categoryId,
        payment_method_id: paymentMethodId,
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        is_active: true,
      });
      await db.RecurringExpense.create({
        user_id: userId,
        name: '현재 구독',
        amount: 15000,
        category_id: categoryId,
        payment_method_id: paymentMethodId,
        start_date: '2026-01-01',
        is_active: true,
      });

      const response = await request(app)
        .get('/api/recurring-expenses/month-summary?month=2026-04')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.totalAmount).toBe(15000);
      expect(response.body.data.count).toBe(1);
    });
  });
});
