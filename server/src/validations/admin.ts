import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['admin', 'user']),
});

export const updateStatusSchema = z.object({
  is_active: z.boolean(),
});

export const createAdminCategorySchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['income', 'expense']),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const updateAdminCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  type: z.enum(['income', 'expense']).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const updateSettingsSchema = z.object({
  app_name: z.string().min(1).max(50).optional(),
  budget_alert_threshold: z.number().int().min(1).max(100).optional(),
  default_currency: z.string().min(1).max(10).optional(),
});
