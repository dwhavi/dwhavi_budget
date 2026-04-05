import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

let app: any;
let db: any;

const defaultCategories = [
  { name: '급여', type: 'income', icon: '💰', color: '#22c55e', sort_order: 1 },
  { name: '부수입', type: 'income', icon: '💼', color: '#3b82f6', sort_order: 2 },
  { name: '용돈', type: 'income', icon: '🎁', color: '#a855f7', sort_order: 3 },
  { name: '식비', type: 'expense', icon: '🍽️', color: '#ef4444', sort_order: 4 },
  { name: '교통', type: 'expense', icon: '🚌', color: '#f97316', sort_order: 5 },
  { name: '주거', type: 'expense', icon: '🏠', color: '#8b5cf6', sort_order: 6 },
  { name: '통신', type: 'expense', icon: '📱', color: '#06b6d4', sort_order: 7 },
  { name: '유흥', type: 'expense', icon: '🎮', color: '#ec4899', sort_order: 8 },
  { name: '쇼핑', type: 'expense', icon: '🛍️', color: '#f59e0b', sort_order: 9 },
  { name: '의료', type: 'expense', icon: '🏥', color: '#14b8a6', sort_order: 10 },
  { name: '교육', type: 'expense', icon: '📚', color: '#6366f1', sort_order: 11 },
  { name: '기타', type: 'expense', icon: '📌', color: '#64748b', sort_order: 12 },
];

const testUser = {
  email: 'budget-test@example.com',
  password: 'Password123',
  display_name: 'Budget Tester',
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

describe('Budgets API', () => {
  let accessToken: string;
  let userId: number;

  beforeEach(async () => {
    await db.Budget.destroy({ where: {} });
    await db.Category.destroy({ where: {} });
    await db.User.destroy({ where: {} });

    await seedGlobalCategories();
    const user = await createTestUser();
    userId = user.id;
    accessToken = generateAccessToken(user);
  });

  afterEach(async () => {
    await db.Budget.destroy({ where: {} });
    await db.Category.destroy({ where: {} });
    await db.User.destroy({ where: {} });
  });

  describe('GET /api/budgets?month=YYYY-MM', () => {
    it('returns empty array when no budgets set', async () => {
      const response = await request(app)
        .get('/api/budgets?month=2026-04')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.budgets).toEqual([]);
    });

    it('returns user budgets for a specific month with category info', async () => {
      const category = await db.Category.findOne({ where: { name: '식비', user_id: null } });

      await db.Budget.create({
        user_id: userId,
        category_id: category.id,
        month: '2026-04',
        amount: 500000,
      });

      const response = await request(app)
        .get('/api/budgets?month=2026-04')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.budgets).toHaveLength(1);
      expect(response.body.data.budgets[0].month).toBe('2026-04');
      expect(response.body.data.budgets[0].amount).toBe(500000);
      expect(response.body.data.budgets[0].category_id).toBe(category.id);
      // Should include Category info via include
      expect(response.body.data.budgets[0].category).toBeDefined();
      expect(response.body.data.budgets[0].category.name).toBe('식비');
    });

    it('returns 401 without auth', async () => {
      await request(app)
        .get('/api/budgets?month=2026-04')
        .expect(401);
    });

    it('scopes budgets to the authenticated user only', async () => {
      // Create another user
      const otherUser = await db.User.create({
        email: 'other@example.com',
        password_hash: await bcrypt.hash('Password123', 10),
        display_name: 'Other User',
      });
      const otherToken = generateAccessToken(otherUser);

      const category = await db.Category.findOne({ where: { name: '식비', user_id: null } });

      // Create budget for the main user
      await db.Budget.create({
        user_id: userId,
        category_id: category.id,
        month: '2026-04',
        amount: 500000,
      });

      // Create budget for the other user
      await db.Budget.create({
        user_id: otherUser.id,
        category_id: category.id,
        month: '2026-04',
        amount: 300000,
      });

      // Main user should only see their budget
      const response = await request(app)
        .get('/api/budgets?month=2026-04')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.budgets).toHaveLength(1);
      expect(response.body.data.budgets[0].amount).toBe(500000);

      // Other user should only see their budget
      const otherResponse = await request(app)
        .get('/api/budgets?month=2026-04')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(otherResponse.body.data.budgets).toHaveLength(1);
      expect(otherResponse.body.data.budgets[0].amount).toBe(300000);
    });
  });

  describe('PUT /api/budgets', () => {
    it('creates multiple budgets (bulk upsert)', async () => {
      const cat1 = await db.Category.findOne({ where: { name: '식비', user_id: null } });
      const cat2 = await db.Category.findOne({ where: { name: '교통', user_id: null } });

      const response = await request(app)
        .put('/api/budgets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          budgets: [
            { category_id: cat1.id, month: '2026-04', amount: 500000 },
            { category_id: cat2.id, month: '2026-04', amount: 200000 },
          ],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.budgets).toHaveLength(2);

      // Verify in DB
      const budgets = await db.Budget.findAll({ where: { user_id: userId } });
      expect(budgets).toHaveLength(2);
    });

    it('updates existing budget for same category+month (upsert behavior)', async () => {
      const category = await db.Category.findOne({ where: { name: '식비', user_id: null } });

      // Create initial budget
      await db.Budget.create({
        user_id: userId,
        category_id: category.id,
        month: '2026-04',
        amount: 500000,
      });

      // Upsert with new amount
      const response = await request(app)
        .put('/api/budgets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          budgets: [
            { category_id: category.id, month: '2026-04', amount: 600000 },
          ],
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Should still have only 1 budget (updated, not duplicated)
      const budgets = await db.Budget.findAll({ where: { user_id: userId } });
      expect(budgets).toHaveLength(1);
      expect(budgets[0].amount).toBe(600000);
    });

    it('returns 400 for invalid month format', async () => {
      const cat1 = await db.Category.findOne({ where: { name: '식비', user_id: null } });

      const response = await request(app)
        .put('/api/budgets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          budgets: [
            { category_id: cat1.id, month: '2026-4', amount: 500000 },
          ],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('returns 400 for negative amount', async () => {
      const cat1 = await db.Category.findOne({ where: { name: '식비', user_id: null } });

      const response = await request(app)
        .put('/api/budgets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          budgets: [
            { category_id: cat1.id, month: '2026-04', amount: -100 },
          ],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('returns 401 without auth', async () => {
      await request(app)
        .put('/api/budgets')
        .send({
          budgets: [
            { category_id: 1, month: '2026-04', amount: 500000 },
          ],
        })
        .expect(401);
    });
  });
});
