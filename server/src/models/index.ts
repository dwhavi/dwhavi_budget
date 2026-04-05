import { Sequelize } from 'sequelize';
import path from 'path';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(process.env.DB_PATH || './data/budget.db'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

export type ModelRegistry = {
  User: typeof import('./User.js').User;
  Category: typeof import('./Category.js').Category;
  Transaction: typeof import('./Transaction.js').Transaction;
  PaymentMethod: typeof import('./PaymentMethod.js').PaymentMethod;
  Budget: typeof import('./Budget.js').Budget;
  RecurringExpense: typeof import('./RecurringExpense.js').RecurringExpense;
};

export const db: ModelRegistry = {} as ModelRegistry;

export async function loadModels(): Promise<void> {
  if (db.User) {
    return;
  }

  const userModel = await import('./User.js');
  const categoryModel = await import('./Category.js');
  const transactionModel = await import('./Transaction.js');
  const paymentMethodModel = await import('./PaymentMethod.js');
  const budgetModel = await import('./Budget.js');
  const recurringExpenseModel = await import('./RecurringExpense.js');

  db.User = userModel.User;
  db.Category = categoryModel.Category;
  db.Transaction = transactionModel.Transaction;
  db.PaymentMethod = paymentMethodModel.PaymentMethod;
  db.Budget = budgetModel.Budget;
  db.RecurringExpense = recurringExpenseModel.RecurringExpense;

  setupAssociations();
}

function setupAssociations(): void {
  const { User, Category, Transaction, PaymentMethod, Budget, RecurringExpense } = db;
  
  if (User.associations && Object.keys(User.associations).length > 0) {
    return;
  }

  User.hasMany(Category, { foreignKey: 'user_id', as: 'categories' });
  Category.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
  Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  Category.hasMany(Transaction, { foreignKey: 'category_id', as: 'transactions' });
  Transaction.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

  PaymentMethod.hasMany(Transaction, { foreignKey: 'payment_method_id', as: 'transactions' });
  Transaction.belongsTo(PaymentMethod, { foreignKey: 'payment_method_id', as: 'paymentMethod' });

  User.hasMany(PaymentMethod, { foreignKey: 'user_id', as: 'paymentMethods' });
  PaymentMethod.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasMany(Budget, { foreignKey: 'user_id', as: 'budgets' });
  Budget.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  Category.hasMany(Budget, { foreignKey: 'category_id', as: 'budgets' });
  Budget.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

  User.hasMany(RecurringExpense, { foreignKey: 'user_id', as: 'recurringExpenses' });
  RecurringExpense.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  Category.hasMany(RecurringExpense, { foreignKey: 'category_id', as: 'recurringExpenses' });
  RecurringExpense.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

  PaymentMethod.hasMany(RecurringExpense, { foreignKey: 'payment_method_id', as: 'recurringExpenses' });
  RecurringExpense.belongsTo(PaymentMethod, { foreignKey: 'payment_method_id', as: 'paymentMethod' });
}
