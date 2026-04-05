import { Router, Response } from 'express';
import { sequelize } from '../models/index.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

function calculateRemainingDaysInMonth(): number {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const diffTime = lastDayOfMonth.getTime() - tomorrow.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(diffDays, 1);
}

router.get('/dashboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { month } = req.query;

    if (!month || typeof month !== 'string') {
      return res.status(400).json({ success: false, message: '월(month) 파라미터가 필요합니다' });
    }

    const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthPattern.test(month)) {
      return res.status(400).json({ success: false, message: '월(month) 형식이 올바르지 않습니다 (YYYY-MM)' });
    }

    const monthPrefix = `${month}%`;

    const totalIncomeQuery = `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM Transactions 
      WHERE user_id = ? AND type = 'income' AND date LIKE ? AND deleted_at IS NULL
    `;

    const totalExpenseQuery = `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM Transactions 
      WHERE user_id = ? AND type = 'expense' AND date LIKE ? AND deleted_at IS NULL
    `;

    const categoryRankingQuery = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        SUM(t.amount) as total,
        c.color
      FROM Transactions t 
      JOIN Categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense' AND t.date LIKE ? AND t.deleted_at IS NULL
      GROUP BY c.id, c.name, c.color
      ORDER BY total DESC 
      LIMIT 5
    `;

    const recentTransactionsQuery = `
      SELECT 
        t.id,
        t.type,
        t.amount,
        t.date,
        t.sub_category,
        t.memo,
        c.name as category_name,
        c.color as category_color,
        pm.name as payment_method_name,
        pm.color as payment_method_color
      FROM Transactions t
      LEFT JOIN Categories c ON t.category_id = c.id
      LEFT JOIN PaymentMethods pm ON t.payment_method_id = pm.id
      WHERE t.user_id = ? AND t.deleted_at IS NULL
      ORDER BY t.date DESC, t.id DESC
      LIMIT 5
    `;

    const [totalIncomeResult] = await sequelize.query(totalIncomeQuery, {
      replacements: [userId, monthPrefix],
      type: 'SELECT'
    }) as any[];

    const [totalExpenseResult] = await sequelize.query(totalExpenseQuery, {
      replacements: [userId, monthPrefix],
      type: 'SELECT'
    }) as any[];

    const categoryRanking = await sequelize.query(categoryRankingQuery, {
      replacements: [userId, monthPrefix],
      type: 'SELECT'
    }) as any[];

    const recentTransactions = await sequelize.query(recentTransactionsQuery, {
      replacements: [userId],
      type: 'SELECT'
    }) as any[];

    const totalIncome = Number(totalIncomeResult.total) || 0;
    const totalExpense = Number(totalExpenseResult.total) || 0;
    const balance = totalIncome - totalExpense;
    const remainingDays = calculateRemainingDaysInMonth();
    const dailyAllowance = remainingDays > 0 ? Math.floor(balance / remainingDays) : 0;

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance,
        dailyAllowance,
        categoryRanking,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.get('/monthly-trend', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const monthlyTrendQuery = `
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM Transactions 
      WHERE user_id = ? AND deleted_at IS NULL AND date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `;

    const monthlyTrend = await sequelize.query(monthlyTrendQuery, {
      replacements: [userId],
      type: 'SELECT'
    }) as any[];

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    
    const result: any[] = [];
    
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(sixMonthsAgo);
      monthDate.setMonth(monthDate.getMonth() + i);
      const monthStr = monthDate.toISOString().slice(0, 7);
      
      const existingData = monthlyTrend.find((item: any) => item.month === monthStr);
      
      if (existingData) {
        result.push({
          month: monthStr,
          income: Number(existingData.income),
          expense: Number(existingData.expense)
        });
      } else {
        result.push({
          month: monthStr,
          income: 0,
          expense: 0
        });
      }
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get monthly trend error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.get('/category', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { month } = req.query;

    if (!month || typeof month !== 'string') {
      return res.status(400).json({ success: false, message: '월(month) 파라미터가 필요합니다' });
    }

    const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthPattern.test(month)) {
      return res.status(400).json({ success: false, message: '월(month) 형식이 올바르지 않습니다 (YYYY-MM)' });
    }

    const categoryStatsQuery = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        SUM(t.amount) as total,
        c.color
      FROM Transactions t 
      JOIN Categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense' AND t.date LIKE ? AND t.deleted_at IS NULL
      GROUP BY c.id, c.name, c.color
      ORDER BY total DESC
    `;

    const categoryStats = await sequelize.query(categoryStatsQuery, {
      replacements: [userId, `${month}%`],
      type: 'SELECT'
    }) as any[];

    const totalExpense = categoryStats.reduce((sum: number, item: any) => sum + Number(item.total), 0);
    
    const result = categoryStats.map((item: any) => ({
      category_id: item.category_id,
      category_name: item.category_name,
      total: Number(item.total),
      percentage: totalExpense > 0 ? (Number(item.total) / totalExpense) * 100 : 0,
      color: item.color
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.get('/payment-methods', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { month } = req.query;

    if (!month || typeof month !== 'string') {
      return res.status(400).json({ success: false, message: '월(month) 파라미터가 필요합니다' });
    }

    const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthPattern.test(month)) {
      return res.status(400).json({ success: false, message: '월(month) 형식이 올바르지 않습니다 (YYYY-MM)' });
    }

    const paymentMethodStatsQuery = `
      SELECT 
        pm.id as payment_method_id,
        pm.name as payment_method_name,
        SUM(t.amount) as total
      FROM Transactions t 
      LEFT JOIN PaymentMethods pm ON t.payment_method_id = pm.id
      WHERE t.user_id = ? AND t.type = 'expense' AND t.date LIKE ? AND t.deleted_at IS NULL 
        AND t.payment_method_id IS NOT NULL AND pm.id IS NOT NULL
      GROUP BY pm.id, pm.name
      ORDER BY total DESC
    `;

    const paymentMethodStats = await sequelize.query(paymentMethodStatsQuery, {
      replacements: [userId, `${month}%`],
      type: 'SELECT'
    }) as any[];

    const totalExpense = paymentMethodStats.reduce((sum: number, item: any) => sum + Number(item.total), 0);
    
    const result = paymentMethodStats.map((item: any) => ({
      payment_method_id: item.payment_method_id,
      payment_method_name: item.payment_method_name,
      total: Number(item.total),
      percentage: totalExpense > 0 ? (Number(item.total) / totalExpense) * 100 : 0
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get payment methods stats error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

export { router as statsRouter };