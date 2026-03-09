const { Sequelize, DataTypes, Model } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Use the same DB configuration as in index.ts
const sequelize = new Sequelize(
  process.env.DB_DATABASE || 'test',
  process.env.DB_USERNAME || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '4000'),
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
    },
  }
);

class User extends Model {}
User.init({
  id: { type: DataTypes.STRING(36), primaryKey: true },
  email: { type: DataTypes.STRING(255), unique: true, allowNull: false },
  role: { type: DataTypes.ENUM('superadmin', 'owner', 'manager', 'salesperson', 'viewer'), allowNull: false },
}, { sequelize, modelName: 'user', underscored: true });

async function promoteToSuperAdmin(email) {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error(`User with email ${email} not found.`);
      return;
    }

    await user.update({ role: 'superadmin' });
    console.log(`User ${email} has been promoted to superadmin.`);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Usage: node promote-superadmin.js <email>');
} else {
  promoteToSuperAdmin(email);
}
