import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

let app: any;
let db: any;

beforeAll(async () => {
  const { setupApp } = await import('../index.js');
  app = await setupApp();
  const { db: dbRegistry } = await import('../models/index.js');
  db = dbRegistry;
});

async function createTestUser(userData: any = testUser) {
  return await db.User.create({
    ...userData,
    password_hash: await bcrypt.hash(userData.password, 10),
  });
}

const testUser = {
  email: 'test@example.com',
  password: 'Password123',
  display_name: 'Test User',
};

const testLogin = {
  email: 'test@example.com',
  password: 'Password123',
};

describe('Auth API', () => {
  beforeEach(async () => {
    await db.User.destroy({ where: {} });
    await db.PaymentMethod.destroy({ where: {} });
  });

  afterEach(async () => {
    await db.User.destroy({ where: {} });
    await db.PaymentMethod.destroy({ where: {} });
  });

  describe('POST /api/auth/register', () => {
    it('1. should register a new user with valid input', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.display_name).toBe(testUser.display_name);
      expect(response.body.data.user).not.toHaveProperty('password_hash');
      
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken');
    });

    it('2. should return 400 for duplicate email', async () => {
      await createTestUser();

      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('이미 사용중인 이메일입니다');
    });

    it('3. should return 400 for invalid email', async () => {
      const invalidUser = { ...testUser, email: 'invalid-email' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('4. should return 400 for password less than 8 characters', async () => {
      const invalidUser = { ...testUser, password: 'short' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('5. should assign admin role to first user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.data.user.role).toBe('admin');
    });

    it('6. should create default "현금" PaymentMethod', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      const user = await db.User.findOne({ where: { email: testUser.email } });
      const paymentMethods = await db.PaymentMethod.findAll({ where: { user_id: user!.id } });
      
      expect(paymentMethods).toHaveLength(1);
      expect(paymentMethods[0].name).toBe('현금');
      expect(paymentMethods[0].type).toBe('cash');
      expect(paymentMethods[0].is_default).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser();
    });

    it('7. should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(testLogin)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user.email).toBe(testLogin.email);
      
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken');
    });

    it('8. should return 401 for wrong password', async () => {
      const wrongPassword = { ...testLogin, password: 'wrongpassword' };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(wrongPassword)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('이메일 또는 비밀번호가 올바르지 않습니다');
    });

    it('9. should return 401 for non-existent email', async () => {
      const nonExistentEmail = { ...testLogin, email: 'nonexistent@example.com' };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(nonExistentEmail)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('이메일 또는 비밀번호가 올바르지 않습니다');
    });

    it('10. should return 403 for inactive user', async () => {
      await db.User.update({ is_active: false }, { where: { email: testLogin.email } });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(testLogin)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('비활성화된 계정입니다');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('11. should clear refresh token cookie', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken=;');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const user = await createTestUser();

      refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
        { expiresIn: '7d' }
      );
    });

    it('12. should return new access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(typeof response.body.data.accessToken).toBe('string');
    });

    it('13. should return 401 for expired/invalid refresh token', async () => {
      const invalidToken = 'invalid.token.here';
      
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${invalidToken}`])
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('유효하지 않은 리프레시 토큰입니다');
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;
    let userId: number;

    beforeEach(async () => {
      const user = await createTestUser();
      userId = user.id;

      accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'dev-secret-change-in-production',
        { expiresIn: '15m' }
      );
    });

    it('14. should return user data with valid access token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.id).toBe(userId);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    it('15. should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('인증이 필요합니다');
    });
  });

  describe('PATCH /api/auth/password', () => {
    let accessToken: string;

    beforeEach(async () => {
      const user = await createTestUser();

      accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'dev-secret-change-in-production',
        { expiresIn: '15m' }
      );
    });

    it('16. should change password with correct current password', async () => {
      const passwordData = {
        current_password: testUser.password,
        new_password: 'NewPassword123',
      };

      const response = await request(app)
        .patch('/api/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('비밀번호가 변경되었습니다');
    });

    it('17. should return 401 for wrong current password', async () => {
      const passwordData = {
        current_password: 'wrongpassword',
        new_password: 'NewPassword123',
      };

      const response = await request(app)
        .patch('/api/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(passwordData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('현재 비밀번호가 올바르지 않습니다');
    });
  });
});