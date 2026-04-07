import { Router, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../models/index.js';
import { registerSchema, loginSchema, passwordChangeSchema } from '../validations/auth.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

interface RefreshTokenPayload {
  userId: number;
}

const router = Router();

function generateAccessToken(userId: number, email: string, role: string): string {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
  
  const options: SignOptions = {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn']
  };
  
  return jwt.sign(
    { userId, email, role },
    secret,
    options
  );
}

function generateRefreshToken(userId: number): string {
  const secret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  
  const options: SignOptions = {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn']
  };
  
  return jwt.sign(
    { userId },
    secret,
    options
  );
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

router.post('/register', validate(registerSchema), async (req: AuthRequest, res: Response) => {
  try {
    if (!db.User) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const { email, password, display_name } = req.body;

    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: '이미 사용중인 이메일입니다' 
      });
    }

    const userCount = await db.User.count();
    const role = userCount === 0 ? 'admin' : 'user';

    const password_hash = await hashPassword(password);

    const user = await db.User.create({
      email,
      password_hash,
      display_name,
      role
    });

    if (db.PaymentMethod) {
      await db.PaymentMethod.create({
        user_id: user.id,
        name: '현금',
        type: 'cash',
        is_default: true
      });
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const { password_hash: _, ...userWithoutPassword } = user.toJSON();
    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        accessToken
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.post('/login', validate(loginSchema), async (req: AuthRequest, res: Response) => {
  try {
    if (!db.User) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const { email, password } = req.body;

    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '이메일 또는 비밀번호가 올바르지 않습니다' 
      });
    }

    if (!user.is_active) {
      return res.status(403).json({ 
        success: false, 
        message: '비활성화된 계정입니다' 
      });
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '이메일 또는 비밀번호가 올바르지 않습니다' 
      });
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const { password_hash: _, ...userWithoutPassword } = user.toJSON();
    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        accessToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    path: '/api/auth/refresh'
  });
  res.json({ success: true, message: '로그아웃되었습니다' });
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    if (!db.User) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: '리프레시 토큰이 없습니다' 
      });
    }

    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production'
    ) as RefreshTokenPayload;

    const user = await db.User.findByPk(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ 
        success: false, 
        message: '유효하지 않은 리프레시 토큰입니다' 
      });
    }

    const newAccessToken = generateAccessToken(user.id, user.email, user.role);
    
    res.json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: '유효하지 않은 리프레시 토큰입니다' 
    });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!db.User) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const user = await db.User.findByPk(req.user!.userId, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '사용자를 찾을 수 없습니다' 
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.patch('/password', authMiddleware, validate(passwordChangeSchema), async (req: AuthRequest, res: Response) => {
  try {
    if (!db.User) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const { current_password, new_password } = req.body;

    const user = await db.User.findByPk(req.user!.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '사용자를 찾을 수 없습니다' 
      });
    }

    const isCurrentPasswordValid = await comparePassword(current_password, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '현재 비밀번호가 올바르지 않습니다' 
      });
    }

    const newPasswordHash = await hashPassword(new_password);

    await user.update({ password_hash: newPasswordHash });

    res.json({
      success: true,
      message: '비밀번호가 변경되었습니다'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

export { router as authRouter };