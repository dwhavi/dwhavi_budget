import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void | Response {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다' });
  }
  next();
}
