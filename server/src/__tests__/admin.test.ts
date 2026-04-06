import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Application } from 'express';
import type { ModelRegistry } from '../models/index.js';

interface TestUser {
  id: number;
  email: string;
  role: string;
  [key: string]: unknown;
}

let app: Application;
let db: ModelRegistry;

const adminUser = {
  email: 'admin@example.com',
  password: 'AdminPass123',
  display_name: 'Admin',
};

const normalUser = {
  email: 'user@example.com',
  password: 'UserPass123',
  display_name: 'Normal User',
};

beforeAll(async () => {
  const { setupApp } = await import('../index.js');
  app = await setupApp();
  const { db: dbRegistry } = await import('../models/index.js');
  db = dbRegistry;
});

async function createUser(userData: typeof adminUser, role: 'admin' | 'user' = 'user') {
  return await db.User.create({
    ...userData,
    password_hash: await bcrypt.hash(userData.password, 10),
    role,
  });
}

function generateToken(user: { id: number; email: string; role: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'dev-secret-change-in-production',
    { expiresIn: '15m' },
  );
}

describe('Admin API', () => {
  let adminToken: string;
  let userToken: string;
  let admin: TestUser;
  let normal: TestUser;

  beforeEach(async () => {
    await db.Transaction.destroy({ where: {} });
    await db.Category.destroy({ where: {} });
    await db.User.destroy({ where: {} });

    admin = (await createUser(adminUser, 'admin')) as unknown as TestUser;
    normal = (await createUser(normalUser, 'user')) as unknown as TestUser;
    adminToken = generateToken(admin);
    userToken = generateToken(normal);
  });

  afterEach(async () => {
    await db.Transaction.destroy({ where: {} });
    await db.Category.destroy({ where: {} });
    await db.User.destroy({ where: {} });
  });

  describe('GET /api/admin/users', () => {
    it('returns all users (admin only)', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.users[0]).toHaveProperty('email');
      expect(response.body.data.users[0]).not.toHaveProperty('password_hash');
    });

    it('returns 403 without admin role', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('returns 401 without auth', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    it('updates user role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${normal.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('admin');

      const updated = await db.User.findByPk(normal.id);
      expect(updated!.role).toBe('admin');
    });

    it('returns 400 with invalid role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${normal.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'superadmin' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('returns 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/admin/users/99999/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/admin/users/:id/status', () => {
    it('toggles is_active', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${normal.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.is_active).toBe(false);

      const updated = await db.User.findByPk(normal.id);
      expect(updated!.is_active).toBe(false);
    });

    it('returns 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/admin/users/99999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: false })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/categories', () => {
    it('returns all categories (global + all users)', async () => {
      await db.Category.bulkCreate([
        { name: '전역수입', type: 'income', icon: '💰', color: '#22c55e', user_id: null, sort_order: 1 },
        { name: '개인비용', type: 'expense', icon: '🍽️', color: '#ef4444', user_id: normal.id, sort_order: 2 },
      ]);

      const response = await request(app)
        .get('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toHaveLength(2);
    });
  });

  describe('POST /api/admin/categories', () => {
    it('creates global category (user_id: null)', async () => {
      const response = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '관리자카테고리', type: 'expense', icon: '🔧', color: '#ff0000' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe('관리자카테고리');
      expect(response.body.data.category.user_id).toBeNull();
    });
  });

  describe('PUT /api/admin/categories/:id', () => {
    it('updates any category including global', async () => {
      const category = await db.Category.create({
        name: '전역수정', type: 'income', icon: '💰', color: '#22c55e', user_id: null, sort_order: 1,
      });

      const response = await request(app)
        .put(`/api/admin/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '수정됨' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe('수정됨');
    });

    it('returns 404 for non-existent category', async () => {
      const response = await request(app)
        .put('/api/admin/categories/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '수정시도' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/admin/categories/:id', () => {
    it('soft deletes category', async () => {
      const category = await db.Category.create({
        name: '삭제대상', type: 'expense', icon: '🗑️', color: '#000000', user_id: null, sort_order: 1,
      });

      const response = await request(app)
        .delete(`/api/admin/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const deleted = await db.Category.findByPk(category.id);
      expect(deleted!.deleted_at).not.toBeNull();
    });
  });

  describe('GET /api/admin/settings', () => {
    it('returns system settings', async () => {
      const response = await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toHaveProperty('app_name');
      expect(response.body.data.settings).toHaveProperty('budget_alert_threshold');
      expect(response.body.data.settings).toHaveProperty('default_currency');
    });
  });

  describe('PUT /api/admin/settings', () => {
    it('updates system settings', async () => {
      const response = await request(app)
        .put('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ app_name: '테스트가계부', budget_alert_threshold: 90 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings.app_name).toBe('테스트가계부');
      expect(response.body.data.settings.budget_alert_threshold).toBe(90);
    });

    it('persists settings across requests', async () => {
      await request(app)
        .put('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ app_name: '영구설정' });

      const response = await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.settings.app_name).toBe('영구설정');
    });

    it('returns 400 with invalid threshold', async () => {
      const response = await request(app)
        .put('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ budget_alert_threshold: 150 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/summary', () => {
    it('returns system dashboard summary', async () => {
      await db.Category.create({
        name: '요약카테고리', type: 'expense', icon: '📊', color: '#000000', user_id: null, sort_order: 1,
      });

      const response = await request(app)
        .get('/api/admin/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toHaveProperty('totalUsers');
      expect(response.body.data.summary).toHaveProperty('totalTransactions');
      expect(response.body.data.summary).toHaveProperty('totalCategories');
      expect(response.body.data.summary.totalUsers).toBe(2);
      expect(response.body.data.summary.totalCategories).toBeGreaterThanOrEqual(1);
      expect(response.body.data.summary.totalTransactions).toBe(0);
    });
  });
});
