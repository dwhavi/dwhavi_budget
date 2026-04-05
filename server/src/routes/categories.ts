import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { db } from '../models/index.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from '../validations/category.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!db.Category) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const userId = req.user!.userId;
    const { type } = req.query;

    const where: Record<string, unknown> = {
      deleted_at: null,
    };

    if (type === 'income' || type === 'expense') {
      where.type = type;
    }

    const categories = await db.Category.findAll({
      where: {
        ...where,
        [Op.or]: [
          { user_id: null },
          { user_id: userId },
        ],
      },
      order: [['sort_order', 'ASC']],
    });

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.post('/', authMiddleware, validate(createCategorySchema), async (req: AuthRequest, res: Response) => {
  try {
    if (!db.Category) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const userId = req.user!.userId;
    const { name, type, icon, color } = req.body;

    const category = await db.Category.create({
      user_id: userId,
      name,
      type,
      icon: icon ?? '📌',
      color: color ?? '#64748b',
      sort_order: 0,
    });

    res.status(201).json({
      success: true,
      data: { category },
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.put('/:id', authMiddleware, validate(updateCategorySchema), async (req: AuthRequest, res: Response) => {
  try {
    if (!db.Category) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const userId = req.user!.userId;
    const { id } = req.params;

    const category = await db.Category.findByPk(Number(id));

    if (!category) {
      return res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다' });
    }

    if (category.user_id === null) {
      return res.status(403).json({ success: false, message: '전역 카테고리는 수정할 수 없습니다' });
    }

    if (category.user_id !== userId) {
      return res.status(403).json({ success: false, message: '권한이 없습니다' });
    }

    await category.update(req.body);

    res.json({
      success: true,
      data: { category },
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!db.Category) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const userId = req.user!.userId;
    const { id } = req.params;

    const category = await db.Category.findByPk(Number(id));

    if (!category) {
      return res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다' });
    }

    if (category.user_id === null) {
      return res.status(403).json({ success: false, message: '전역 카테고리는 삭제할 수 없습니다' });
    }

    if (category.user_id !== userId) {
      return res.status(403).json({ success: false, message: '권한이 없습니다' });
    }

    await category.update({ deleted_at: new Date() });

    res.json({
      success: true,
      message: '카테고리가 삭제되었습니다',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

export { router as categoriesRouter };
