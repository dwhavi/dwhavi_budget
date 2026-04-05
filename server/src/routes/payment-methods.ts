import { Router, Response } from 'express';
import { db } from '../models/index.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createPaymentMethodSchema, updatePaymentMethodSchema } from '../validations/payment-method.js';

const router = Router();

// GET /api/payment-methods — list user's active payment methods
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const paymentMethods = await db.PaymentMethod.findAll({
      where: {
        user_id: req.user!.userId,
        deleted_at: null,
      },
      order: [['created_at', 'ASC']],
    });

    res.json({ success: true, data: { paymentMethods } });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

// POST /api/payment-methods — create new payment method
router.post('/', authMiddleware, validate(createPaymentMethodSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { name, issuer, type, color, is_default, memo } = req.body;

    const paymentMethod = await db.PaymentMethod.create({
      user_id: req.user!.userId,
      name,
      issuer: issuer || null,
      type,
      color: color || null,
      is_default: is_default ?? false,
      memo: memo || null,
    });

    res.status(201).json({ success: true, data: { paymentMethod } });
  } catch (error) {
    console.error('Create payment method error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

// PUT /api/payment-methods/:id — update own payment method
router.put('/:id', authMiddleware, validate(updatePaymentMethodSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const paymentMethod = await db.PaymentMethod.findOne({
      where: { id: Number(id), deleted_at: null },
    });

    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: '결제수단을 찾을 수 없습니다' });
    }

    if (paymentMethod.user_id !== req.user!.userId) {
      return res.status(403).json({ success: false, message: '권한이 없습니다' });
    }

    await paymentMethod.update(req.body);

    res.json({ success: true, data: { paymentMethod } });
  } catch (error) {
    console.error('Update payment method error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

// DELETE /api/payment-methods/:id — soft delete
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const paymentMethod = await db.PaymentMethod.findOne({
      where: { id: Number(id), deleted_at: null },
    });

    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: '결제수단을 찾을 수 없습니다' });
    }

    if (paymentMethod.user_id !== req.user!.userId) {
      return res.status(403).json({ success: false, message: '권한이 없습니다' });
    }

    if (paymentMethod.name === '현금') {
      return res.status(400).json({ success: false, message: '현금은 삭제할 수 없습니다' });
    }

    await paymentMethod.update({ deleted_at: new Date() });

    res.json({ success: true, message: '결제수단이 삭제되었습니다' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
});

export { router as paymentMethodsRouter };
