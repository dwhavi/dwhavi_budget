import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from './index.js';

interface CategoryAttributes {
  id: number;
  user_id: number | null;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  sort_order: number;
  deleted_at: Date | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

type CategoryCreationAttributes = Optional<CategoryAttributes, 'id' | 'deleted_at' | 'created_at' | 'updated_at'>;

class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  declare id: number;
  declare user_id: number | null;
  declare name: string;
  declare type: 'income' | 'expense';
  declare icon: string;
  declare color: string;
  declare sort_order: number;
  declare deleted_at: Date | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('income', 'expense'),
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'Categories',
    modelName: 'Category',
  },
);

export { Category };
export type { CategoryAttributes, CategoryCreationAttributes };
