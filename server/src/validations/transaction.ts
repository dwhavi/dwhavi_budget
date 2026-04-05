import { z } from 'zod';

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().int().min(1).max(99999999),
  category_id: z.number().int().positive(),
  payment_method_id: z.number().int().positive().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sub_category: z.string().max(50).optional(),
  memo: z.string().max(200).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();