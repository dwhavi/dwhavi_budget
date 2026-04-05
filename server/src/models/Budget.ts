import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from './index.js';

interface BudgetAttributes {
  id: number;
  user_id: number;
  category_id: number;
  month: string;
  amount: number;
  readonly created_at: Date;
  readonly updated_at: Date;
}

type BudgetCreationAttributes = Optional<BudgetAttributes, 'id' | 'created_at' | 'updated_at'>;

class Budget extends Model<BudgetAttributes, BudgetCreationAttributes> implements BudgetAttributes {
  declare id: number;
  declare user_id: number;
  declare category_id: number;
  declare month: string;
  declare amount: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Budget.init(
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
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Categories',
        key: 'id',
      },
    },
    month: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
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
    tableName: 'Budgets',
    modelName: 'Budget',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'category_id', 'month'],
      },
    ],
  },
);

export { Budget };
export type { BudgetAttributes, BudgetCreationAttributes };
