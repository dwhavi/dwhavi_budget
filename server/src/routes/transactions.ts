import { Router, Response } from 'express';
import { Op, type WhereOptions, type Order } from 'sequelize';
import { db } from '../models/index.js';
import { createTransactionSchema, updateTransactionSchema } from '../validations/transaction.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';



const router = Router();

interface TransactionQueryParams {
  month?: string;
  date?: string;
  category_id?: string;
  payment_method_id?: string;
  min_amount?: string;
  max_amount?: string;
  keyword?: string;
}
interface WhereClause {
  user_id: number;
  deleted_at: null;
  date?: { [Op.between]: [string, string] } | string;
  category_id?: number;
  payment_method_id?: number;
  amount?: { [Op.gte]?: number; [Op.lte]?: number };
  memo?: { [Op.like]: string };
}

function buildWhereClause(userId: number, queryParams: TransactionQueryParams): WhereClause {
  const whereClause: WhereClause = {
    user_id: userId,
    deleted_at: null,
  };

  if (queryParams.month && typeof queryParams.month === 'string') {
    const [year, month] = queryParams.month.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year, 10), parseInt(month, 10), 0).toISOString().split('T')[0];
    whereClause.date = {
      [Op.between]: [startDate, endDate],
    };
  }

  if (queryParams.date && typeof queryParams.date === 'string') {
    whereClause.date = queryParams.date;
  }

  if (queryParams.category_id && typeof queryParams.category_id === 'string') {
    whereClause.category_id = parseInt(queryParams.category_id, 10);
  }

  if (queryParams.payment_method_id && typeof queryParams.payment_method_id === 'string') {
    whereClause.payment_method_id = parseInt(queryParams.payment_method_id, 10);
  }

  if (queryParams.min_amount && typeof queryParams.min_amount === 'string') {
    whereClause.amount = {
      ...(whereClause.amount || {}),
      [Op.gte]: parseInt(queryParams.min_amount, 10),
    };
  }

  if (queryParams.max_amount && typeof queryParams.max_amount === 'string') {
    whereClause.amount = {
      ...(whereClause.amount || {}),
      [Op.lte]: parseInt(queryParams.max_amount, 10),
    };
  }

  if (queryParams.keyword && typeof queryParams.keyword === 'string') {
    whereClause.memo = {
      [Op.like]: `%${queryParams.keyword}%`,
    };
  }

  return whereClause;
}

function buildOrderClause(sortParam: string, orderParam: string): Order {
  const sortField = sortParam === 'date' || sortParam === 'amount' || sortParam === 'category' ? sortParam : 'date';
  const orderDirection = orderParam === 'asc' || orderParam === 'desc' ? orderParam : 'desc';
  
  if (sortField === 'category') {
    return [
      [db.Category, 'name', orderDirection],
      ['date', 'desc'],
    ];
  }
  
  return [[sortField, orderDirection]];
}

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!db.Transaction || !db.Category) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const userId = req.user!.userId;
    const {
      sort = 'date',
      order = 'desc',
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    const whereClause = buildWhereClause(userId, req.query as TransactionQueryParams);
    const orderClause = buildOrderClause(String(sort), String(order));

    const total = await db.Transaction.count({ where: whereClause as unknown as WhereOptions });
    const totalPages = Math.ceil(total / limitNum);

    const transactions = await db.Transaction.findAll({
      where: whereClause as unknown as WhereOptions,
      include: [
        {
          model: db.Category,
          as: 'category',
          attributes: ['id', 'name', 'type', 'icon', 'color'],
        },
        {
          model: db.PaymentMethod,
          as: 'paymentMethod',
          attributes: ['id', 'name', 'type'],
          required: false,
        },
      ],
      order: orderClause,
      limit: limitNum,
      offset: offset,
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.post('/', authMiddleware, validate(createTransactionSchema), async (req: AuthRequest, res: Response) => {
  try {
    if (!db.Transaction || !db.Category) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const userId = req.user!.userId;
    const { type, amount, category_id, payment_method_id, date, sub_category, memo } = req.body;

    const category = await db.Category.findOne({
      where: {
        id: category_id as number,
        user_id: { [Op.or]: [userId, null] },
        deleted_at: null,
      },
    });

    if (!category) {
      return res.status(400).json({ success: false, message: '존재하지 않는 카테고리입니다' });
    }

    if (category.type !== type) {
      return res.status(400).json({
        success: false,
        message: `${type === 'income' ? '수입' : '지출'} 카테고리만 선택할 수 있습니다`,
      });
    }

    if (payment_method_id) {
      const paymentMethod = await db.PaymentMethod.findOne({
        where: {
          id: payment_method_id,
          user_id: userId,
        },
      });

      if (!paymentMethod) {
        return res.status(400).json({ success: false, message: '존재하지 않는 결제 수단입니다' });
      }
    }

    const transaction = await db.Transaction.create({
      user_id: userId,
      type,
      amount,
      category_id,
      payment_method_id,
      date,
      sub_category,
      memo,
    });

    const createdTransaction = await db.Transaction.findByPk(transaction.id, {
      include: [
        {
          model: db.Category,
          as: 'category',
          attributes: ['id', 'name', 'type', 'icon', 'color'],
        },
        {
          model: db.PaymentMethod,
          as: 'paymentMethod',
          attributes: ['id', 'name', 'type'],
          required: false,
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: {
        transaction: createdTransaction,
      },
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.put('/:id', authMiddleware, validate(updateTransactionSchema), async (req: AuthRequest, res: Response) => {
  try {
    if (!db.Transaction || !db.Category) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const userId = req.user!.userId;
    const transactionId = parseInt(req.params.id as string);
    const updateData = req.body;

    const transaction = await db.Transaction.findOne({
      where: {
        id: transactionId,
        user_id: userId,
        deleted_at: null,
      },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: '거래 내역을 찾을 수 없습니다' });
    }

    if (updateData.category_id) {
      const category = await db.Category.findOne({
        where: {
          id: updateData.category_id as number,
          user_id: { [Op.or]: [userId, null] },
          deleted_at: null,
        },
      });

      if (!category) {
        return res.status(400).json({ success: false, message: '존재하지 않는 카테고리입니다' });
      }

      const transactionType = updateData.type || transaction.type;
      if (category.type !== transactionType) {
        return res.status(400).json({
          success: false,
          message: `${transactionType === 'income' ? '수입' : '지출'} 카테고리만 선택할 수 있습니다`,
        });
      }
    }

    if (updateData.payment_method_id) {
      const paymentMethod = await db.PaymentMethod.findOne({
        where: {
          id: updateData.payment_method_id as number,
          user_id: userId,
        },
      });

      if (!paymentMethod) {
        return res.status(400).json({ success: false, message: '존재하지 않는 결제 수단입니다' });
      }
    }

    await transaction.update(updateData);

    const updatedTransaction = await db.Transaction.findByPk(transaction.id, {
      include: [
        {
          model: db.Category,
          as: 'category',
          attributes: ['id', 'name', 'type', 'icon', 'color'],
        },
        {
          model: db.PaymentMethod,
          as: 'paymentMethod',
          attributes: ['id', 'name', 'type'],
          required: false,
        },
      ],
    });

    res.json({
      success: true,
      data: {
        transaction: updatedTransaction,
      },
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!db.Transaction) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const userId = req.user!.userId;
    const transactionId = parseInt(req.params.id as string);

    const transaction = await db.Transaction.findOne({
      where: {
        id: transactionId,
        user_id: userId,
        deleted_at: null,
      },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: '거래 내역을 찾을 수 없습니다' });
    }

    await transaction.update({ deleted_at: new Date() });

    res.json({
      success: true,
      message: '거래 내역이 삭제되었습니다',
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

router.patch('/:id/restore', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!db.Transaction) {
      return res.status(500).json({ success: false, message: '모델이 로드되지 않았습니다' });
    }

    const userId = req.user!.userId;
    const transactionId = parseInt(req.params.id as string);

    const transaction = await db.Transaction.findOne({
      where: {
        id: transactionId,
        user_id: userId,
        deleted_at: { [Op.ne]: null },
      },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: '삭제된 거래 내역을 찾을 수 없습니다' });
    }

    await transaction.update({ deleted_at: null });

    const restoredTransaction = await db.Transaction.findByPk(transaction.id, {
      include: [
        {
          model: db.Category,
          as: 'category',
          attributes: ['id', 'name', 'type', 'icon', 'color'],
        },
        {
          model: db.PaymentMethod,
          as: 'paymentMethod',
          attributes: ['id', 'name', 'type'],
          required: false,
        },
      ],
    });

    res.json({
      success: true,
      data: {
        transaction: restoredTransaction,
      },
    });
  } catch (error) {
    console.error('Restore transaction error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

export { router as transactionsRouter };