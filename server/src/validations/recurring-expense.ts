import { z } from 'zod';

export const createRecurringExpenseSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().int().min(1),
  category_id: z.number().int().positive(),
  payment_method_id: z.number().int().positive(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  memo: z.string().max(200).optional(),
});

export const updateRecurringExpenseSchema = createRecurringExpenseSchema.partial();
