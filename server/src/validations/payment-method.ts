import { z } from 'zod';

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1).max(50),
  issuer: z.string().max(50).optional(),
  type: z.enum(['credit', 'debit', 'cash', 'transfer']),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  is_default: z.boolean().optional(),
  memo: z.string().max(200).optional(),
});

export const updatePaymentMethodSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  issuer: z.string().max(50).optional(),
  type: z.enum(['credit', 'debit', 'cash', 'transfer']).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  is_default: z.boolean().optional(),
  memo: z.string().max(200).optional(),
});
