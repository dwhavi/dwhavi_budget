import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues[0]?.message || '입력값이 유효하지 않습니다';
      return res.status(400).json({ success: false, message });
    }
    req.body = result.data;
    next();
  };
}
