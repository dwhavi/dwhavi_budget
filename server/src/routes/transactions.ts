import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { db } from '../models/index.js';
import { createTransactionSchema, updateTransactionSchema } from '../validations/transaction.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

function buildWhereClause(userId: number, queryParams: any) {
  const whereClause: any = {
    user_id: userId,
    deleted_at: null,
  };

  if (queryParams.month) {
    const [year, month] = queryParams.month.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
    whereClause.date = {
      [Op.between]: [startDate, endDate],
    };
  }

  if (queryParams.date) {
    whereClause.date = queryParams.date;
  }

  if (queryParams.category_id) {
    whereClause.category_id = parseInt(queryParams.category_id);
  }

  if (queryParams.payment_method_id) {
    whereClause.payment_method_id = parseInt(queryParams.payment_method_id);
  }

  if (queryParams.min_amount) {
    whereClause.amount = {
      ...(whereClause.amount || {}),
      [Op.gte]: parseInt(queryParams.min_amount),
    };
  }

  if (queryParams.max_amount) {
    whereClause.amount = {
      ...(whereClause.amount || {}),
      [Op.lte]: parseInt(queryParams.max_amount),
    };
  }

  if (queryParams.keyword) {
    whereClause.memo = {
      [Op.like]: `%${queryParams.keyword}%`,
    };
  }

  return whereClause;
}

function buildOrderClause(sortParam: string, orderParam: string): any[] {
  const validSortFields = ['date', 'amount', 'category'];
  const validOrderDirections = ['asc', 'desc'];
  
  const sortField = validSortFields.includes(sortParam) ? sortParam : 'date';
  const orderDirection = validOrderDirections.includes(orderParam) ? orderParam : 'desc';
  
  if (sortField === 'category') {
    return [
      [{ model: db.Category }, 'name', orderDirection] as any,
      ['date', 'desc'] as any,
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
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    const whereClause = buildWhereClause(userId, req.query);
    const orderClause = buildOrderClause(sort as string, order as string);

    const total = await db.Transaction.count({ where: whereClause });
    const totalPages = Math.ceil(total / limitNum);

    const transactions = await db.Transaction.findAll({
      where: whereClause,
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
        id: category_id as any,
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
          id: updateData.category_id as any,
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
          id: updateData.payment_method_id as any,
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