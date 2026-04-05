import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

let app: any;
let db: any;
let accessToken: string;
let userId: number;
let categoryId: number;

beforeAll(async () => {
  const { setupApp } = await import('../index.js');
  app = await setupApp();
  const { db: dbRegistry, sequelize } = await import('../models/index.js');
  db = dbRegistry;
  await sequelize.sync({ force: true });
});

async function createTestUser(userData: any = testUser) {
  return await db.User.create({
    ...userData,
    password_hash: await bcrypt.hash(userData.password, 10),
  });
}

const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'Password123',
  display_name: 'Test User',
};

async function createTestCategory(userId: number) {
  return await db.Category.create({
    user_id: userId,
    name: '식비',
    type: 'expense',
    icon: '🍽️',
    color: '#FF6B6B',
    sort_order: 0,
  });
}

async function createTestPaymentMethod(userId: number) {
  return await db.PaymentMethod.create({
    user_id: userId,
    name: '현금',
    type: 'cash',
    is_default: true
  });
}

async function createTestTransaction(userId: number, categoryId: number, paymentMethodId: number, subCategory: string | null = null) {
  return await db.Transaction.create({
    user_id: userId,
    type: 'expense',
    amount: 10000,
    category_id: categoryId,
    payment_method_id: paymentMethodId,
    date: '2023-01-01',
    sub_category: subCategory,
    memo: null,
    deleted_at: null,
  });
}

describe('SubCategories API', () => {
  let paymentMethodId: number;

  beforeEach(async () => {
    testUser.email = `test-${Date.now()}@example.com`;
    
    const user = await createTestUser();
    userId = user.id;
    
    const paymentMethod = await createTestPaymentMethod(userId);
    paymentMethodId = paymentMethod.id;

    const category = await createTestCategory(userId);
    categoryId = category.id;

    accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret-change-in-production',
      { expiresIn: '15m' }
    );
  });

  afterEach(async () => {
    await db.Transaction.destroy({ where: {} });
    await db.PaymentMethod.destroy({ where: {} });
    await db.Category.destroy({ where: {} });
    await db.User.destroy({ where: {} });
  });

  describe('GET /api/subcategories', () => {
    it('1. returns empty array when no sub_categories exist', async () => {
      const response = await request(app)
        .get('/api/subcategories')
        .query({ category_id: categoryId })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('2. returns ["점심"] after creating transaction with sub_category="점심"', async () => {
      await createTestTransaction(userId, categoryId, paymentMethodId, '점심');

      const response = await request(app)
        .get('/api/subcategories')
        .query({ category_id: categoryId })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(['점심']);
    });

    it('3. filters by prefix when q parameter is provided', async () => {
      await createTestTransaction(userId, categoryId, paymentMethodId, '점심');
      await createTestTransaction(userId, categoryId, paymentMethodId, '저녁');
      await createTestTransaction(userId, categoryId, paymentMethodId, '간식');

      const response = await request(app)
        .get('/api/subcategories')
        .query({ category_id: categoryId, q: '점' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(['점심']);
    });

    it('4. returns top 10 by frequency when creating 12 different sub_categories', async () => {
      for (let i = 1; i <= 12; i++) {
        for (let j = 0; j < i; j++) { 
          await createTestTransaction(userId, categoryId, paymentMethodId, `sub_${i}`);
        }
      }

      const response = await request(app)
        .get('/api/subcategories')
        .query({ category_id: categoryId })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10); 
      expect(response.body.data).toEqual(['sub_12', 'sub_11', 'sub_10', 'sub_9', 'sub_8', 'sub_7', 'sub_6', 'sub_5', 'sub_4', 'sub_3']);
    });

    it('5. returns 400 when category_id is missing', async () => {
      const response = await request(app)
        .get('/api/subcategories')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('category_id가 필요합니다');
    });

    it('6. returns 404 when category does not exist or does not belong to user', async () => {
      const response = await request(app)
        .get('/api/subcategories')
        .query({ category_id: 99999 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('카테고리를 찾을 수 없습니다');
    });

    it('7. excludes null and empty sub_category values', async () => {
      await createTestTransaction(userId, categoryId, paymentMethodId, '점심');
      await createTestTransaction(userId, categoryId, paymentMethodId, null);
      await createTestTransaction(userId, categoryId, paymentMethodId, '');

      const response = await request(app)
        .get('/api/subcategories')
        .query({ category_id: categoryId })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(['점심']);
    });

    it('8. excludes transactions with deleted_at not null', async () => {
      await createTestTransaction(userId, categoryId, paymentMethodId, '점심');
      await createTestTransaction(userId, categoryId, paymentMethodId, '저녁');
      
      await db.Transaction.update(
        { deleted_at: new Date() },
        { where: { sub_category: '저녁' } }
      );

      const response = await request(app)
        .get('/api/subcategories')
        .query({ category_id: categoryId })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(['점심']);
    });

    it('9. requires authentication', async () => {
      const response = await request(app)
        .get('/api/subcategories')
        .query({ category_id: categoryId })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('인증이 필요합니다');
    });
  });
});