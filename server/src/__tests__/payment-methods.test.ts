import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Application } from 'express';
import type { ModelRegistry } from '../models/index.js';

let app: Application;
let db: ModelRegistry;

beforeAll(async () => {
  const { setupApp } = await import('../index.js');
  app = await setupApp();
  const { db: dbRegistry } = await import('../models/index.js');
  db = dbRegistry;
});

const testUser = {
  email: 'pm-test@example.com',
  password: 'Password123',
  display_name: 'PM Test User',
};

const otherUser = {
  email: 'pm-other@example.com',
  password: 'Password123',
  display_name: 'PM Other User',
};

async function createTestUser(userData: typeof testUser) {
  return await db.User.create({
    ...userData,
    password_hash: await bcrypt.hash(userData.password, 10),
  });
}

function generateToken(user: { id: number; email: string; role: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'dev-secret-change-in-production',
    { expiresIn: '15m' },
  );
}

describe('PaymentMethods API', () => {
  let accessToken: string;
  let userId: number;

  beforeEach(async () => {
    await db.PaymentMethod.destroy({ where: { user_id: userId }, force: true }).catch(() => {});
    await db.User.destroy({ where: { email: testUser.email }, force: true }).catch(() => {});
    await db.User.destroy({ where: { email: otherUser.email }, force: true }).catch(() => {});

    const user = await createTestUser(testUser);
    userId = user.id;
    accessToken = generateToken(user);

    await db.PaymentMethod.create({
      user_id: user.id,
      name: '현금',
      type: 'cash',
      is_default: true,
    });
  });

  afterEach(async () => {
    await db.PaymentMethod.destroy({ where: { user_id: userId }, force: true }).catch(() => {});
    await db.User.destroy({ where: { email: testUser.email }, force: true }).catch(() => {});
    await db.User.destroy({ where: { email: otherUser.email }, force: true }).catch(() => {});
  });

  describe('GET /api/payment-methods', () => {
    it('1. should return user\'s payment methods (includes default "현금")', async () => {
      const response = await request(app)
        .get('/api/payment-methods')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentMethods).toHaveLength(1);
      expect(response.body.data.paymentMethods[0].name).toBe('현금');
      expect(response.body.data.paymentMethods[0].type).toBe('cash');
      expect(response.body.data.paymentMethods[0].is_default).toBe(true);
    });
  });

  describe('POST /api/payment-methods', () => {
    it('2. should create a credit card with valid data', async () => {
      const newCard = {
        name: '신한카드',
        issuer: '신한은행',
        type: 'credit',
        color: '#FF5733',
        memo: '주 카드',
      };

      const response = await request(app)
        .post('/api/payment-methods')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newCard)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentMethod.name).toBe('신한카드');
      expect(response.body.data.paymentMethod.issuer).toBe('신한은행');
      expect(response.body.data.paymentMethod.type).toBe('credit');
      expect(response.body.data.paymentMethod.color).toBe('#FF5733');
      expect(response.body.data.paymentMethod.user_id).toBe(userId);
    });

    it('3. should create a transfer type payment method', async () => {
      const newTransfer = {
        name: '계좌이체',
        type: 'transfer',
      };

      const response = await request(app)
        .post('/api/payment-methods')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newTransfer)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentMethod.name).toBe('계좌이체');
      expect(response.body.data.paymentMethod.type).toBe('transfer');
    });
  });

  describe('PUT /api/payment-methods/:id', () => {
    it('4. should update own payment method', async () => {
      const card = await db.PaymentMethod.create({
        user_id: userId,
        name: '삼성카드',
        type: 'credit',
      });

      const response = await request(app)
        .put(`/api/payment-methods/${card.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '삼성카드 프리미엄', color: '#000000' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentMethod.name).toBe('삼성카드 프리미엄');
      expect(response.body.data.paymentMethod.color).toBe('#000000');
    });
  });

  describe('DELETE /api/payment-methods/:id', () => {
    it('5. should soft delete non-cash payment method', async () => {
      const card = await db.PaymentMethod.create({
        user_id: userId,
        name: '국민카드',
        type: 'debit',
      });

      const response = await request(app)
        .delete(`/api/payment-methods/${card.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const found = await db.PaymentMethod.findByPk(card.id, { paranoid: false });
      expect(found!.deleted_at).not.toBeNull();
    });

    it('6. should reject deleting "현금" payment method with 400', async () => {
      const cashMethod = (await db.PaymentMethod.findOne({
        where: { user_id: userId, name: '현금' },
      }))!;

      const response = await request(app)
        .delete(`/api/payment-methods/${cashMethod.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('현금은 삭제할 수 없습니다');
    });
  });

  describe('Authorization', () => {
    it('7. should return 403 when accessing other user\'s card', async () => {
      const other = await createTestUser(otherUser);

      const otherCard = await db.PaymentMethod.create({
        user_id: other.id,
        name: '다른 사람 카드',
        type: 'credit',
      });

      const response = await request(app)
        .put(`/api/payment-methods/${otherCard.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '내 카드' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('권한이 없습니다');
    });
  });

  describe('Validation', () => {
    it('8. should reject invalid type with 400', async () => {
      const invalidCard = {
        name: '테스트',
        type: 'invalid_type',
      };

      const response = await request(app)
        .post('/api/payment-methods')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidCard)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
