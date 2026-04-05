import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from './index.js';

interface PaymentMethodAttributes {
  id: number;
  user_id: number;
  name: string;
  issuer: string | null;
  type: 'credit' | 'debit' | 'cash' | 'transfer';
  color: string | null;
  is_default: boolean;
  memo: string | null;
  deleted_at: Date | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

type PaymentMethodCreationAttributes = Optional<PaymentMethodAttributes, 'id' | 'is_default' | 'deleted_at' | 'created_at' | 'updated_at'>;

class PaymentMethod extends Model<PaymentMethodAttributes, PaymentMethodCreationAttributes> implements PaymentMethodAttributes {
  declare id: number;
  declare user_id: number;
  declare name: string;
  declare issuer: string | null;
  declare type: 'credit' | 'debit' | 'cash' | 'transfer';
  declare color: string | null;
  declare is_default: boolean;
  declare memo: string | null;
  declare deleted_at: Date | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

PaymentMethod.init(
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
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    issuer: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('credit', 'debit', 'cash', 'transfer'),
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: 'PaymentMethods',
    modelName: 'PaymentMethod',
  },
);

export { PaymentMethod };
export type { PaymentMethodAttributes, PaymentMethodCreationAttributes };
