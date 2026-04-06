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
  email: 'test@example.com',
  password: 'Password123',
  display_name: 'Test User',
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

describe('Categories API', () => {
  let accessToken: string;

  beforeEach(async () => {
    await db.Category.destroy({ where: {} });
    await db.User.destroy({ where: {} });

    await seedGlobalCategories();
    const user = await createTestUser();
    accessToken = generateAccessToken(user);
  });

  afterEach(async () => {
    await db.Category.destroy({ where: {} });
    await db.User.destroy({ where: {} });
  });

  it('1. GET /api/categories → returns global seed categories (12) + 0 personal', async () => {
    const response = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.categories).toHaveLength(12);
  });

  it('2. POST /api/categories → creates personal category', async () => {
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '커피', type: 'expense' })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.category.name).toBe('커피');
    expect(response.body.data.category.type).toBe('expense');
    expect(response.body.data.category.icon).toBe('📌');
    expect(response.body.data.category.color).toBe('#64748b');
  });

  it('3. GET /api/categories → 12 global + 1 personal after creation', async () => {
    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '커피', type: 'expense' });

    const response = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.categories).toHaveLength(13);
  });

  it('4. PUT /api/categories/:id (global category) → 403', async () => {
    const globalCategory = (await db.Category.findOne({ where: { user_id: null } }))!;

    const response = await request(app)
      .put(`/api/categories/${globalCategory.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '수정시도' })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('전역 카테고리는 수정할 수 없습니다');
  });

  it('5. PUT /api/categories/:id (own category) → updates successfully', async () => {
    const createResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '커피', type: 'expense' });

    const categoryId = createResponse.body.data.category.id;

    const response = await request(app)
      .put(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '카페인' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.category.name).toBe('카페인');
  });

  it('6. DELETE /api/categories/:id (personal) → soft delete success', async () => {
    const createResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '커피', type: 'expense' });

    const categoryId = createResponse.body.data.category.id;

    const response = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('카테고리가 삭제되었습니다');
  });

  it('7. soft-deleted categories excluded from GET', async () => {
    const createResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '커피', type: 'expense' });

    const categoryId = createResponse.body.data.category.id;

    await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const response = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.categories).toHaveLength(12);
  });
});
