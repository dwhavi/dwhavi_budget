import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from './index.js';

interface TransactionAttributes {
  id: number;
  user_id: number;
  type: 'income' | 'expense';
  amount: number;
  category_id: number;
  payment_method_id: number | null;
  date: string;
  sub_category: string | null;
  memo: string | null;
  deleted_at: Date | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

type TransactionCreationAttributes = Optional<TransactionAttributes, 'id' | 'deleted_at' | 'created_at' | 'updated_at'>;

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  declare id: number;
  declare user_id: number;
  declare type: 'income' | 'expense';
  declare amount: number;
  declare category_id: number;
  declare payment_method_id: number | null;
  declare date: string;
  declare sub_category: string | null;
  declare memo: string | null;
  declare deleted_at: Date | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Transaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('income', 'expense'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 99999999,
      },
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Categories',
        key: 'id',
      },
    },
    payment_method_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'PaymentMethods',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    sub_category: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    memo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Transactions',
    modelName: 'Transaction',
  },
);

export { Transaction };
export type { TransactionAttributes, TransactionCreationAttributes };
