import { z } from 'zod';

const budgetItemSchema = z.object({
  category_id: z.number().int().positive(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, '월 형식은 YYYY-MM이어야 합니다'),
  amount: z.number().int().min(0, '금액은 0 이상이어야 합니다'),
});

export const budgetUpsertSchema = z.object({
  budgets: z.array(budgetItemSchema).min(1),
});
