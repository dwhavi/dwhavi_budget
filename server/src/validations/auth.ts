import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다').regex(/[a-zA-Z]/, '영문 포함 필요').regex(/[0-9]/, '숫자 포함 필요'),
  display_name: z.string().min(2, '이름은 2자 이상').max(20, '이름은 20자 이하'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const passwordChangeSchema = z.object({
  current_password: z.string(),
  new_password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다').regex(/[a-zA-Z]/, '영문 포함 필요').regex(/[0-9]/, '숫자 포함 필요'),
});