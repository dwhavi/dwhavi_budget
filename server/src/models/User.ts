import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from './index.js';

interface UserAttributes {
  id: number;
  email: string;
  password_hash: string;
  display_name: string;
  role: 'admin' | 'user';
  is_active: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;
}

type UserCreationAttributes = Optional<UserAttributes, 'id' | 'role' | 'is_active' | 'created_at' | 'updated_at'>;

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare email: string;
  declare password_hash: string;
  declare display_name: string;
  declare role: 'admin' | 'user';
  declare is_active: boolean;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    display_name: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'Users',
    modelName: 'User',
  },
);

export { User };
export type { UserAttributes, UserCreationAttributes };
