import { Router, Response } from 'express';
import { db } from '../models/index.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { budgetUpsertSchema } from '../validations/budget.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!db.Budget) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const userId = req.user!.userId;
    const { month } = req.query;

    const budgets = await db.Budget.findAll({
      where: {
        user_id: userId,
        month: month as string,
      },
      include: [
        { model: db.Category, as: 'category' },
      ],
    });

    res.json({
      success: true,
      data: { budgets },
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.put('/', authMiddleware, validate(budgetUpsertSchema), async (req: AuthRequest, res: Response) => {
  try {
    if (!db.Budget) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const userId = req.user!.userId;
    const { budgets } = req.body;

    const budgetRows = budgets.map((b: { category_id: number; month: string; amount: number }) => ({
      user_id: userId,
      category_id: b.category_id,
      month: b.month,
      amount: b.amount,
    }));

    await db.Budget.bulkCreate(budgetRows, {
      updateOnDuplicate: ['amount', 'updated_at'],
    });

    const updatedBudgets = await db.Budget.findAll({
      where: { user_id: userId },
      include: [
        { model: db.Category, as: 'category' },
      ],
    });

    res.json({
      success: true,
      data: { budgets: updatedBudgets },
    });
  } catch (error) {
    console.error('Upsert budgets error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

export { router as budgetsRouter };
