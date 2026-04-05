import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { sequelize, loadModels, db } from '../models/index.js';

const defaultCategories = [
  { name: '급여', type: 'income' as const, icon: '💰', color: '#22c55e', sort_order: 1 },
  { name: '부수입', type: 'income' as const, icon: '💼', color: '#3b82f6', sort_order: 2 },
  { name: '용돈', type: 'income' as const, icon: '🎁', color: '#a855f7', sort_order: 3 },
  { name: '식비', type: 'expense' as const, icon: '🍽️', color: '#ef4444', sort_order: 4 },
  { name: '교통', type: 'expense' as const, icon: '🚌', color: '#f97316', sort_order: 5 },
  { name: '주거', type: 'expense' as const, icon: '🏠', color: '#8b5cf6', sort_order: 6 },
  { name: '통신', type: 'expense' as const, icon: '📱', color: '#06b6d4', sort_order: 7 },
  { name: '유흥', type: 'expense' as const, icon: '🎮', color: '#ec4899', sort_order: 8 },
  { name: '쇼핑', type: 'expense' as const, icon: '🛍️', color: '#f59e0b', sort_order: 9 },
  { name: '의료', type: 'expense' as const, icon: '🏥', color: '#14b8a6', sort_order: 10 },
  { name: '교육', type: 'expense' as const, icon: '📚', color: '#6366f1', sort_order: 11 },
  { name: '기타', type: 'expense' as const, icon: '📌', color: '#64748b', sort_order: 12 },
];

async function seed(): Promise<void> {
  try {
    await loadModels();
    await sequelize.sync();

    const existingCount = await db.Category.count({ where: { user_id: null } });
    if (existingCount > 0) {
      console.log(`이미 ${existingCount}개의 글로벌 카테고리가 존재합니다. 시드를 건너뜁니다.`);
      await sequelize.close();
      return;
    }

    await db.Category.bulkCreate(
      defaultCategories.map((cat) => ({ ...cat, user_id: null })),
    );

    console.log(`${defaultCategories.length}개의 기본 카테고리가 생성되었습니다.`);
    await sequelize.close();
  } catch (error) {
    console.error('시드 실행 중 오류 발생:', error);
    await sequelize.close();
    process.exit(1);
  }
}

seed();
