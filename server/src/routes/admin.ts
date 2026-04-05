import { Router, Response } from 'express';
import { db } from '../models/index.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { validate } from '../middleware/validate.js';
import {
  updateRoleSchema,
  updateStatusSchema,
  createAdminCategorySchema,
  updateAdminCategorySchema,
  updateSettingsSchema,
} from '../validations/admin.js';

const router = Router();

let systemSettings = {
  app_name: '가계부',
  budget_alert_threshold: 80,
  default_currency: 'KRW',
};

router.get('/users', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['id', 'ASC']],
    });

    res.json({ success: true, data: { users } });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.put('/users/:id/role', authMiddleware, adminMiddleware, validate(updateRoleSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await db.User.findByPk(Number(id));
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다' });
    }

    await user.update({ role });

    res.json({ success: true, data: { user: { id: user.id, email: user.email, role: user.role, is_active: user.is_active, display_name: user.display_name } } });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.put('/users/:id/status', authMiddleware, adminMiddleware, validate(updateStatusSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const user = await db.User.findByPk(Number(id));
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다' });
    }

    await user.update({ is_active });

    res.json({ success: true, data: { user: { id: user.id, email: user.email, role: user.role, is_active: user.is_active, display_name: user.display_name } } });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.get('/categories', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await db.Category.findAll({
      where: { deleted_at: null },
      order: [['sort_order', 'ASC']],
    });

    res.json({ success: true, data: { categories } });
  } catch (error) {
    console.error('Get admin categories error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.post('/categories', authMiddleware, adminMiddleware, validate(createAdminCategorySchema), async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, icon, color, sort_order } = req.body;

    const category = await db.Category.create({
      user_id: null,
      name,
      type,
      icon: icon ?? '📌',
      color: color ?? '#64748b',
      sort_order: sort_order ?? 0,
    });

    res.status(201).json({ success: true, data: { category } });
  } catch (error) {
    console.error('Create admin category error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.put('/categories/:id', authMiddleware, adminMiddleware, validate(updateAdminCategorySchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const category = await db.Category.findByPk(Number(id));
    if (!category) {
      return res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다' });
    }

    await category.update(req.body);

    res.json({ success: true, data: { category } });
  } catch (error) {
    console.error('Update admin category error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.delete('/categories/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const category = await db.Category.findByPk(Number(id));
    if (!category) {
      return res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다' });
    }

    await category.update({ deleted_at: new Date() });

    res.json({ success: true, message: '카테고리가 삭제되었습니다' });
  } catch (error) {
    console.error('Delete admin category error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.get('/settings', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { settings: systemSettings } });
});

router.put('/settings', authMiddleware, adminMiddleware, validate(updateSettingsSchema), async (req: AuthRequest, res: Response) => {
  systemSettings = { ...systemSettings, ...req.body };
  res.json({ success: true, data: { settings: systemSettings } });
});

router.get('/summary', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await db.User.count();
    const totalTransactions = await db.Transaction.count({ where: { deleted_at: null } });
    const totalCategories = await db.Category.count({ where: { deleted_at: null } });

    res.json({
      success: true,
      data: {
        summary: { totalUsers, totalTransactions, totalCategories },
      },
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

export { router as adminRouter };
