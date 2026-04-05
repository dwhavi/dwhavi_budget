import { Router, Response } from 'express';
import { db, sequelize } from '../models/index.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!db.Transaction || !db.Category) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const category_id = req.query.category_id ? parseInt(req.query.category_id as string) : null;
    const q = req.query.q as string || '';

    if (!category_id) {
      return res.status(400).json({ success: false, message: 'category_id가 필요합니다' });
    }

    const category = await db.Category.findOne({
      where: {
        id: category_id,
        user_id: req.user!.userId
      }
    });

    if (!category) {
      return res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다' });
    }

    const subCategories = await db.Transaction.findAll({
      attributes: [
        'sub_category',
        [sequelize.fn('COUNT', sequelize.col('sub_category')), 'count']
      ],
      where: {
        user_id: req.user!.userId,
        category_id: category_id,
        sub_category: {
          [Op.not]: null
        },
        ...(q && {
          sub_category: {
            [Op.like]: `${q}%`
          }
        }),
        deleted_at: null
      },
      group: ['sub_category'],
      order: [[sequelize.fn('COUNT', sequelize.col('sub_category')), 'DESC']],
      limit: 10,
      raw: true
    });

    const result = subCategories
      .map((item: any) => item.sub_category)
      .filter((sub_category: string | null) => sub_category !== null && sub_category !== '');

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

export { router as subcategoriesRouter };