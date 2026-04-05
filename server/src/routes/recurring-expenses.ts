import { Router, Response } from 'express';
import { db } from '../models/index.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createRecurringExpenseSchema, updateRecurringExpenseSchema } from '../validations/recurring-expense.js';
import { Op } from 'sequelize';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const expenses = await db.RecurringExpense.findAll({
      where: {
        user_id: req.user!.userId,
        deleted_at: null,
      },
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, data: { expenses } });
  } catch (error) {
    console.error('List recurring expenses error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.post('/', validate(createRecurringExpenseSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { name, amount, category_id, payment_method_id, start_date, end_date, memo } = req.body;

    const expense = await db.RecurringExpense.create({
      user_id: req.user!.userId,
      name,
      amount,
      category_id,
      payment_method_id,
      start_date,
      end_date: end_date || null,
      memo: memo || null,
    });

    res.status(201).json({ success: true, data: { expense } });
  } catch (error) {
    console.error('Create recurring expense error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.put('/:id', validate(updateRecurringExpenseSchema), async (req: AuthRequest, res: Response) => {
  try {
    const expense = await db.RecurringExpense.findOne({
      where: {
        id: req.params.id,
        user_id: req.user!.userId,
        deleted_at: null,
      },
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: '항목을 찾을 수 없습니다' });
    }

    await expense.update(req.body);

    res.json({ success: true, data: { expense } });
  } catch (error) {
    console.error('Update recurring expense error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const expense = await db.RecurringExpense.findOne({
      where: {
        id: req.params.id,
        user_id: req.user!.userId,
        deleted_at: null,
      },
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: '항목을 찾을 수 없습니다' });
    }

    await expense.update({ deleted_at: new Date() });

    res.json({ success: true, message: '삭제되었습니다' });
  } catch (error) {
    console.error('Delete recurring expense error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.patch('/:id/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const expense = await db.RecurringExpense.findOne({
      where: {
        id: req.params.id,
        user_id: req.user!.userId,
        deleted_at: null,
      },
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: '항목을 찾을 수 없습니다' });
    }

    await expense.update({ is_active: !expense.is_active });

    res.json({ success: true, data: { expense } });
  } catch (error) {
    console.error('Toggle recurring expense error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.get('/month-summary', async (req: AuthRequest, res: Response) => {
  try {
    const month = req.query.month as string;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: '유효한 월을 입력해주세요 (YYYY-MM)' });
    }

    const [year, mon] = month.split('-').map(Number);
    const monthStart = `${year}-${String(mon).padStart(2, '0')}-01`;
    const lastDay = new Date(year, mon, 0).getDate();
    const monthEnd = `${year}-${String(mon).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const expenses = await db.RecurringExpense.findAll({
      where: {
        user_id: req.user!.userId,
        is_active: true,
        deleted_at: null,
        start_date: { [Op.lte]: monthEnd },
        [Op.or]: [
          { end_date: null },
          { end_date: { [Op.gte]: monthStart } },
        ],
      },
    });

    const totalAmount = expenses.reduce((sum: number, e) => sum + e.amount, 0);

    res.json({
      success: true,
      data: {
        month,
        totalAmount,
        count: expenses.length,
        expenses,
      },
    });
  } catch (error) {
    console.error('Month summary error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

export { router as recurringExpensesRouter };
