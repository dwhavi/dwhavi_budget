import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from './index.js';

interface RecurringExpenseAttributes {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  category_id: number;
  payment_method_id: number | null;
  start_date: string;
  end_date: string | null;
  memo: string | null;
  is_active: boolean;
  deleted_at: Date | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

type RecurringExpenseCreationAttributes = Optional<RecurringExpenseAttributes, 'id' | 'is_active' | 'deleted_at' | 'created_at' | 'updated_at'>;

class RecurringExpense extends Model<RecurringExpenseAttributes, RecurringExpenseCreationAttributes> implements RecurringExpenseAttributes {
  declare id: number;
  declare user_id: number;
  declare name: string;
  declare amount: number;
  declare category_id: number;
  declare payment_method_id: number | null;
  declare start_date: string;
  declare end_date: string | null;
  declare memo: string | null;
  declare is_active: boolean;
  declare deleted_at: Date | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

RecurringExpense.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
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
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    memo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'RecurringExpenses',
    modelName: 'RecurringExpense',
  },
);

export { RecurringExpense };
export type { RecurringExpenseAttributes, RecurringExpenseCreationAttributes };
