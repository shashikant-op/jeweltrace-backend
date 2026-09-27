import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes, Model, Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';
const SUBSCRIPTION_AMOUNT_PAISE = parseInt(process.env.SUBSCRIPTION_AMOUNT_PAISE || '100', 10);
const SUBSCRIPTION_DESCRIPTION = process.env.SUBSCRIPTION_DESCRIPTION || 'JewelTrack Base Plan - Monthly (₹1 Test)';
const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;

app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ success: true, message: 'JewelTrack API is running', env: process.env.NODE_ENV || 'development' });
});

app.get('/api/test-email', async (req: express.Request, res: express.Response) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'Email query param is required' });
    
    console.log(`Sending test email to ${email}...`);
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email as string,
      subject: 'JewelTrack SMTP Test',
      text: 'If you are reading this, your SMTP settings are working correctly!',
      html: '<h1>SMTP Test Successful!</h1><p>Your JewelTrack email configuration is working.</p>'
    });
    
    res.json({ success: true, message: `Test email sent to ${email}` });
  } catch (error: any) {
    console.error('SMTP Test Error:', error);
    res.status(500).json({ success: false, message: error.message, details: error.stack });
  }
});

app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json({ 
    success: true, 
    status: 'ok', 
    database: sequelize.getDatabaseName(),
    timestamp: new Date().toISOString(),
    version: '1.0.1' // Increment this to verify deployment
  });
});

// Diagnostic route to list all registered routes
app.get('/api/routes', (req: express.Request, res: express.Response) => {
  const routes: string[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          routes.push(`${Object.keys(handler.route.methods).join(',').toUpperCase()} ${handler.route.path}`);
        }
      });
    }
  });
  res.json({ success: true, routes });
});

// Initialize Sequelize with TiDB Cloud individual variables
const sequelize = new Sequelize(
  process.env.DB_DATABASE || 'test',
  process.env.DB_USERNAME || '3vTNZ2nDFDWfTru.root',
  process.env.DB_PASSWORD || 'c0PVUMdaKq3zc1KJ',
  {
    host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: parseInt(process.env.DB_PORT || '4000'),
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// --- MODELS ---

class Store extends Model {}
Store.init({
  id: { type: DataTypes.STRING(36), primaryKey: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  address: { type: DataTypes.TEXT },
  gst_number: { type: DataTypes.STRING(50) },
  phone: { type: DataTypes.STRING(20) },
  logo_url: { type: DataTypes.STRING(500) },
  currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },
  tax_rate: { type: DataTypes.FLOAT, defaultValue: 3 },
  upi_id: { type: DataTypes.STRING(100) },
  preferences: { type: DataTypes.JSON, defaultValue: {} },
  sub_prompt_ts: { type: DataTypes.BIGINT, defaultValue: 0 },
}, { sequelize, modelName: 'store', underscored: true });

class User extends Model {}
User.init({
  id: { type: DataTypes.STRING(36), primaryKey: true },
  store_id: { type: DataTypes.STRING(36), allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  email: { type: DataTypes.STRING(255), unique: true, allowNull: false },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('superadmin', 'owner', 'manager', 'salesperson', 'viewer'), allowNull: false },
  avatar_url: { type: DataTypes.STRING(500) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, modelName: 'user', underscored: true });

class Category extends Model {}
Category.init({
  id: { type: DataTypes.STRING(36), primaryKey: true },
  store_id: { type: DataTypes.STRING(36), allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  metal_type: { type: DataTypes.ENUM('gold', 'silver', 'platinum', 'other'), allowNull: false },
  description: { type: DataTypes.TEXT },
}, { sequelize, modelName: 'category', underscored: true });

class Product extends Model {}
Product.init({
  id: { type: DataTypes.STRING(36), primaryKey: true },
  store_id: { type: DataTypes.STRING(36), allowNull: false },
  category_id: { type: DataTypes.STRING(36) },
  name: { type: DataTypes.STRING(255), allowNull: false },
  sku: { type: DataTypes.STRING(100) },
  barcode: { type: DataTypes.STRING(100) },
  metal_type: { type: DataTypes.STRING(50) },
  karat: { type: DataTypes.STRING(20) },
  gross_weight: { type: DataTypes.FLOAT, defaultValue: 0 },
  net_weight: { type: DataTypes.FLOAT, defaultValue: 0 },
  stone_type: { type: DataTypes.STRING(100) },
  stone_weight: { type: DataTypes.FLOAT, defaultValue: 0 },
  making_charges: { type: DataTypes.FLOAT, defaultValue: 0 },
  purchase_price: { type: DataTypes.FLOAT, defaultValue: 0 },
  selling_price: { type: DataTypes.FLOAT, defaultValue: 0 },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  min_stock_alert: { type: DataTypes.INTEGER, defaultValue: 0 },
  images: { 
    type: DataTypes.JSON,
    defaultValue: []
  },
  status: { type: DataTypes.STRING(20), defaultValue: 'active' },
}, { sequelize, modelName: 'product', underscored: true });

class Customer extends Model {}
Customer.init({
  id: { type: DataTypes.STRING(36), primaryKey: true },
  store_id: { type: DataTypes.STRING(36), allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(255) },
  address: { type: DataTypes.TEXT },
  anniversary_date: { type: DataTypes.STRING(20) },
  birthday: { type: DataTypes.STRING(20) },
  total_purchases: { type: DataTypes.FLOAT, defaultValue: 0 },
  loyalty_points: { type: DataTypes.INTEGER, defaultValue: 0 },
  notes: { type: DataTypes.TEXT },
}, { sequelize, modelName: 'customer', underscored: true });

class Invoice extends Model {}
Invoice.init({
  id: { type: DataTypes.STRING(36), primaryKey: true },
  store_id: { type: DataTypes.STRING(36), allowNull: false },
  customer_id: { type: DataTypes.STRING(36) },
  invoice_number: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  invoice_date: { type: DataTypes.STRING(20) },
  subtotal: { type: DataTypes.FLOAT, defaultValue: 0 },
  discount: { type: DataTypes.FLOAT, defaultValue: 0 },
  tax_amount: { type: DataTypes.FLOAT, defaultValue: 0 },
  total_amount: { type: DataTypes.FLOAT, defaultValue: 0 },
  payment_method: { type: DataTypes.STRING(50) },
  payment_status: { type: DataTypes.STRING(50) },
  notes: { type: DataTypes.TEXT },
}, { sequelize, modelName: 'invoice', underscored: true });

class InvoiceItem extends Model {}
InvoiceItem.init({
  id: { type: DataTypes.STRING(36), primaryKey: true },
  invoice_id: { type: DataTypes.STRING(36), allowNull: false },
  product_id: { type: DataTypes.STRING(36) },
  product_name: { type: DataTypes.STRING(255) },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  unit_price: { type: DataTypes.FLOAT, defaultValue: 0 },
  metal_price: { type: DataTypes.FLOAT, defaultValue: 0 },
  making_charges: { type: DataTypes.FLOAT, defaultValue: 0 },
  discount_percent: { type: DataTypes.FLOAT, defaultValue: 0 },
  total_price: { type: DataTypes.FLOAT, defaultValue: 0 },
  metal_type: { type: DataTypes.STRING(50) },
  karat: { type: DataTypes.STRING(20) },
  weight: { type: DataTypes.FLOAT, defaultValue: 0 },
}, { sequelize, modelName: 'invoice_item', underscored: true });

class RepairOrder extends Model {}
RepairOrder.init({
  id: { type: DataTypes.STRING(36), primaryKey: true },
  store_id: { type: DataTypes.STRING(36), allowNull: false },
  customer_id: { type: DataTypes.STRING(36) },
  order_number: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  item_description: { type: DataTypes.TEXT },
  issue_description: { type: DataTypes.TEXT },
  photos: { 
    type: DataTypes.JSON,
    defaultValue: []
  },
  assigned_to: { type: DataTypes.STRING(36) },
  estimated_date: { type: DataTypes.STRING(20) },
  advance_amount: { type: DataTypes.FLOAT, defaultValue: 0 },
  total_estimate: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.STRING(50) },
}, { sequelize, modelName: 'repair_order', underscored: true });

class Notification extends Model {}
Notification.init({
  id: { type: DataTypes.STRING(36), primaryKey: true },
  store_id: { type: DataTypes.STRING(36), allowNull: false },
  product_id: { type: DataTypes.STRING(36) },
  title: { type: DataTypes.STRING(255), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('low_stock', 'repair', 'system', 'other'), allowNull: false },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_acknowledged: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_resolved: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, modelName: 'notification', underscored: true });

class MetalRate extends Model {}
MetalRate.init({
  id: { type: DataTypes.STRING(36), primaryKey: true },
  store_id: { type: DataTypes.STRING(36), allowNull: false, unique: true },
  gold_24k_per_gm: { type: DataTypes.FLOAT, defaultValue: 0 },
  gold_22k_per_gm: { type: DataTypes.FLOAT, defaultValue: 0 },
  gold_18k_per_gm: { type: DataTypes.FLOAT, defaultValue: 0 },
  silver_per_gm: { type: DataTypes.FLOAT, defaultValue: 0 },
  platinum_per_gm: { type: DataTypes.FLOAT, defaultValue: 0 }
}, { sequelize, modelName: 'metal_rate', underscored: true });

// Subscription / Quota tracking per store
class StoreQuota extends Model {}
StoreQuota.init({
  id: { type: DataTypes.STRING(36), primaryKey: true },
  store_id: { type: DataTypes.STRING(36), allowNull: false, unique: true },
  usage_month: { type: DataTypes.STRING(7), allowNull: false, defaultValue: () => new Date().toISOString().slice(0,7) },
  invoices_this_month: { type: DataTypes.INTEGER, defaultValue: 0 },
  products_this_month: { type: DataTypes.INTEGER, defaultValue: 0 },
  plan_status: { type: DataTypes.ENUM('trial','active','locked'), defaultValue: 'trial' },
  plan_name: { type: DataTypes.STRING(20), defaultValue: 'base' },
  trial_remaining: { type: DataTypes.INTEGER, defaultValue: 10 },
  plan_started_at: { type: DataTypes.DATE, allowNull: true },
  payment_link_id: { type: DataTypes.STRING(64), allowNull: true },
  onboarding_offer_claimed: { type: DataTypes.BOOLEAN, defaultValue: false },
  premium_expires_at: { type: DataTypes.DATE, allowNull: true },
  total_revenue_paid: { type: DataTypes.FLOAT, defaultValue: 0 }
}, { sequelize, modelName: 'store_quota', underscored: true });

// --- ASSOCIATIONS ---

Store.hasMany(User, { foreignKey: 'store_id' });
User.belongsTo(Store, { foreignKey: 'store_id' });

Store.hasMany(Category, { foreignKey: 'store_id' });
Category.belongsTo(Store, { foreignKey: 'store_id' });

Store.hasMany(Product, { foreignKey: 'store_id' });
Product.belongsTo(Store, { foreignKey: 'store_id' });

Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

Store.hasMany(Customer, { foreignKey: 'store_id' });
Customer.belongsTo(Store, { foreignKey: 'store_id' });

Store.hasMany(Invoice, { foreignKey: 'store_id' });
Invoice.belongsTo(Store, { foreignKey: 'store_id' });

Customer.hasMany(Invoice, { foreignKey: 'customer_id' });
Invoice.belongsTo(Customer, { foreignKey: 'customer_id' });

Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id', as: 'items' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });

Product.hasMany(InvoiceItem, { foreignKey: 'product_id' });
InvoiceItem.belongsTo(Product, { foreignKey: 'product_id' });

Store.hasMany(RepairOrder, { foreignKey: 'store_id' });
RepairOrder.belongsTo(Store, { foreignKey: 'store_id' });

Customer.hasMany(RepairOrder, { foreignKey: 'customer_id' });
RepairOrder.belongsTo(Customer, { foreignKey: 'customer_id' });

User.hasMany(RepairOrder, { foreignKey: 'assigned_to' });
RepairOrder.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

Store.hasMany(Notification, { foreignKey: 'store_id' });
Notification.belongsTo(Store, { foreignKey: 'store_id' });
Store.hasOne(StoreQuota, { foreignKey: 'store_id' });
StoreQuota.belongsTo(Store, { foreignKey: 'store_id' });
Store.hasOne(MetalRate, { foreignKey: 'store_id' });
MetalRate.belongsTo(Store, { foreignKey: 'store_id' });

// --- AUTH MIDDLEWARE ---

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const authorizeSuperAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Superadmin access required' });
  }
};

// --- API ENDPOINTS ---
// Email verification model for OTP workflow
class EmailVerification extends Model {}
EmailVerification.init({
  id: { type: DataTypes.STRING(36), primaryKey: true },
  email: { type: DataTypes.STRING(255), unique: true, allowNull: false },
  otp: { type: DataTypes.STRING(6), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, modelName: 'email_verification', underscored: true });

const useGmail = (process.env.SMTP_HOST || '').includes('gmail') || (process.env.SMTP_USER || '').includes('@gmail.com');
const transporter = useGmail
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Configuration Error:', error);
    console.log('Current SMTP settings:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS ? '********' : 'NOT SET',
      useGmail
    });
  } else {
    console.log('Server is ready to send emails');
  }
});

// Superadmin Endpoints
app.get('/api/superadmin/stats', authenticateToken, authorizeSuperAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const qi = sequelize.getQueryInterface();
    const sqTable = StoreQuota.getTableName() as string;
    let hasPlatformEarnings = false;
    try {
      const schema = await qi.describeTable(sqTable);
      hasPlatformEarnings = 'total_revenue_paid' in schema;
    } catch {}
    const [totalStores, totalUsers, totalProducts, totalInvoices, totalRevenueResult, totalInventoryResult, totalPlatformEarnings] = await Promise.all([
      Store.count(),
      User.count(),
      Product.count(),
      Invoice.count(),
      Invoice.sum('total_amount'),
      Product.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.literal('selling_price * quantity')), 'totalValue']
        ],
        raw: true
      }),
      hasPlatformEarnings ? StoreQuota.sum('total_revenue_paid') : Promise.resolve(0)
    ]);

    const storeStats = await Store.findAll({
      attributes: [
        'id', 'name',
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('users.id'))), 'userCount'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('products.id'))), 'productCount'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('invoices.id'))), 'invoiceCount'],
        [sequelize.fn('SUM', sequelize.col('invoices.total_amount')), 'totalRevenue'],
        [sequelize.fn('SUM', sequelize.literal('products.selling_price * products.quantity')), 'inventoryValue']
      ],
      include: [
        { model: User, attributes: [], required: false },
        { model: Product, attributes: [], required: false },
        { model: Invoice, attributes: [], required: false },
        { model: StoreQuota, attributes: [] }
      ],
      group: ['store.id'],
      raw: true
    });

    res.json({
      success: true,
      stats: {
        totalStores,
        totalUsers,
        totalProducts,
        totalInvoices,
        totalRevenue: Number(totalRevenueResult) || 0,
        totalInventoryValue: Number((totalInventoryResult as any)[0]?.totalValue) || 0,
        totalPlatformEarnings: Number(totalPlatformEarnings) || 0
      },
      storeStats
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public (read-only) stats for demo/fallback
app.get('/api/superadmin/stats-public', async (req: express.Request, res: express.Response) => {
  try {
    const qi = sequelize.getQueryInterface();
    const sqTable = StoreQuota.getTableName() as string;
    let hasPlatformEarnings = false;
    try {
      const schema = await qi.describeTable(sqTable);
      hasPlatformEarnings = 'total_revenue_paid' in schema;
    } catch {}
    const [totalStores, totalUsers, totalProducts, totalInvoices, totalRevenueResult, totalInventoryResult, totalPlatformEarnings] = await Promise.all([
      Store.count(),
      User.count(),
      Product.count(),
      Invoice.count(),
      Invoice.sum('total_amount'),
      Product.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.literal('selling_price * quantity')), 'totalValue']
        ],
        raw: true
      }),
      hasPlatformEarnings ? StoreQuota.sum('total_revenue_paid') : Promise.resolve(0)
    ]);
    const storeStats = await Store.findAll({
      attributes: [
        'id', 'name',
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('users.id'))), 'userCount'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('products.id'))), 'productCount'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('invoices.id'))), 'invoiceCount'],
        [sequelize.fn('SUM', sequelize.col('invoices.total_amount')), 'totalRevenue'],
        [sequelize.fn('SUM', sequelize.literal('products.selling_price * products.quantity')), 'inventoryValue']
      ],
      include: [
        { model: User, attributes: [], required: false },
        { model: Product, attributes: [], required: false },
        { model: Invoice, attributes: [], required: false },
        { model: StoreQuota, attributes: [] }
      ],
      group: ['store.id'],
      raw: true
    });
    res.json({
      success: true,
      stats: {
        totalStores,
        totalUsers,
        totalProducts,
        totalInvoices,
        totalRevenue: Number(totalRevenueResult) || 0,
        totalInventoryValue: Number((totalInventoryResult as any)[0]?.totalValue) || 0,
        totalPlatformEarnings: Number(totalPlatformEarnings) || 0
      },
      storeStats
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/superadmin/leaderboard', authenticateToken, authorizeSuperAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const leaderboard = await Store.findAll({
      attributes: [
        'id', 'name',
        [sequelize.fn('SUM', sequelize.col('invoices.total_amount')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('invoices.id'))), 'invoiceCount'],
        [sequelize.fn('SUM', sequelize.literal('products.selling_price * products.quantity')), 'inventoryValue'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('products.id'))), 'productCount'],
      ],
      include: [
        { model: Invoice, attributes: [], required: false },
        { model: Product, attributes: [], required: false }
      ],
      group: ['store.id'],
      order: [[sequelize.literal('totalRevenue'), 'DESC']],
      limit: 10,
      raw: true
    });

    res.json({
      success: true,
      leaderboard
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/superadmin/stores', authenticateToken, authorizeSuperAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const stores = await Store.findAll({
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'role'] },
        { model: StoreQuota }
      ]
    });
    res.json({ success: true, stores });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/superadmin/users', authenticateToken, authorizeSuperAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const users = await User.findAll({
      include: [{ model: Store, attributes: ['name'] }],
      attributes: { exclude: ['password_hash'] }
    });
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/superadmin/stores/:id', authenticateToken, authorizeSuperAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    // Perform cascading deletes or at least delete the store
    // For now, let's just delete the store and associated users, etc.
    await sequelize.transaction(async (t) => {
      await User.destroy({ where: { store_id: id }, transaction: t });
      await StoreQuota.destroy({ where: { store_id: id }, transaction: t });
      await Store.destroy({ where: { id }, transaction: t });
    });
    res.json({ success: true, message: 'Store deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/superadmin/users/:id/role', authenticateToken, authorizeSuperAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    await User.update({ role }, { where: { id } });
    res.json({ success: true, message: 'User role updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/superadmin/stores/:id/details', authenticateToken, authorizeSuperAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const store = await Store.findByPk(id, {
      include: [
        { model: StoreQuota },
        { model: MetalRate }
      ]
    });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    const [usersCount, productsCount, invoicesCount, customersCount, recentInvoices, topProducts] = await Promise.all([
      User.count({ where: { store_id: id } }),
      Product.count({ where: { store_id: id } }),
      Invoice.count({ where: { store_id: id } }),
      Customer.count({ where: { store_id: id } }),
      Invoice.findAll({ 
        where: { store_id: id }, 
        limit: 5, 
        order: [['created_at', 'DESC']],
        include: [{ model: Customer, attributes: ['name'] }]
      }),
      InvoiceItem.findAll({
        attributes: [
          'product_name',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQty'],
          [sequelize.fn('SUM', sequelize.col('total_price')), 'totalRevenue']
        ],
        include: [{
          model: Invoice,
          as: 'invoice',
          where: { store_id: id },
          attributes: []
        }],
        group: ['product_name'],
        order: [[sequelize.fn('SUM', sequelize.col('total_price')), 'DESC']],
        limit: 5,
        raw: true
      })
    ]);

    res.json({
      success: true,
      store,
      stats: {
        usersCount,
        productsCount,
        invoicesCount,
        customersCount
      },
      recentInvoices,
      topProducts
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/superadmin/search', authenticateToken, authorizeSuperAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { q } = req.query;
    if (!q || String(q).length < 2) return res.json({ success: true, results: { products: [], invoices: [], stores: [] } });

    const [products, invoices, stores] = await Promise.all([
      Product.findAll({
        where: { name: { [Op.like]: `%${q}%` } },
        limit: 5,
        include: [{ model: Store, attributes: ['name'] }]
      }),
      Invoice.findAll({
        where: { invoice_number: { [Op.like]: `%${q}%` } },
        limit: 5,
        include: [{ model: Store, attributes: ['name'] }]
      }),
      Store.findAll({
        where: { name: { [Op.like]: `%${q}%` } },
        limit: 5
      })
    ]);

    res.json({
      success: true,
      results: { products, invoices, stores }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/superadmin/analytics', authenticateToken, authorizeSuperAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { range = '30d' } = req.query;
    const now = new Date();
    let startDate = new Date();
    
    if (range === '7d') startDate.setDate(now.getDate() - 7);
    else if (range === '30d') startDate.setDate(now.getDate() - 30);
    else if (range === '90d') startDate.setDate(now.getDate() - 90);
    else startDate.setFullYear(now.getFullYear() - 1);

    const startDateStr = startDate.toISOString().split('T')[0];

    // 1. Revenue Over Time
    const revenueOverTime = await Invoice.findAll({
      attributes: [
        'invoice_date',
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'daily_revenue']
      ],
      where: {
        invoice_date: { [Op.gte]: startDateStr }
      },
      group: ['invoice_date'],
      order: [['invoice_date', 'ASC']],
      raw: true
    }) as unknown as { invoice_date: string, daily_revenue: number }[];

    // 2. Store Growth (Daily & Cumulative)
    const storeDailyRaw = await Store.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        created_at: { [Op.gte]: startDate }
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    }) as unknown as { date: string, count: number }[];

    // Calculate cumulative stores
    const totalStoresBeforeRange = await Store.count({
      where: { created_at: { [Op.lt]: startDate } }
    });

    let runningTotal = totalStoresBeforeRange;
    const storeGrowth = storeDailyRaw.map(day => {
      runningTotal += Number(day.count);
      return {
        date: day.date,
        daily: Number(day.count),
        cumulative: runningTotal
      };
    });

    // 3. Subscription Distribution & Trends
    const subDistribution = await StoreQuota.findAll({
      attributes: [
        'plan_name',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['plan_name'],
      raw: true
    }) as unknown as { plan_name: string, count: number }[];

    // Active vs Trial conversion
    const activeGrowthRaw = await StoreQuota.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('plan_started_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        plan_status: 'active',
        plan_started_at: { [Op.gte]: startDate }
      },
      group: [sequelize.fn('DATE', sequelize.col('plan_started_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('plan_started_at')), 'ASC']],
      raw: true
    }) as unknown as { date: string, count: number }[];

    const activeTrends = activeGrowthRaw.map(day => ({
      date: day.date,
      count: Number(day.count)
    }));

    // 4. Most Active Stores (by Invoice Count)
    const activeStores = await Invoice.findAll({
      attributes: [
        'store_id',
        [sequelize.fn('COUNT', sequelize.col('invoice.id')), 'invoiceCount'],
        [sequelize.col('store.name'), 'storeName']
      ],
      include: [{
        model: Store,
        attributes: []
      }],
      group: ['store_id', 'store.name'],
      order: [[sequelize.fn('COUNT', sequelize.col('invoice.id')), 'DESC']],
      limit: 5,
      raw: true
    }) as unknown as { store_id: string, invoiceCount: number, storeName: string }[];

    res.json({
       success: true,
       revenueOverTime,
       storeGrowth,
       activeTrends,
       subDistribution,
       activeStores
     });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/send-otp', async (req: express.Request, res: express.Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists. Please sign in instead.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const existing = await EmailVerification.findOne({ where: { email } });
    if (existing) {
      await existing.update({ otp, expires_at: expiresAt, verified: false });
    } else {
      await EmailVerification.create({ id: uuidv4(), email, otp, expires_at: expiresAt, verified: false });
    }

    console.log(`[OTP] Sending request for: ${email}`);
    try {
      // Create a timeout promise (15 seconds)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email server timed out. Check your SMTP settings or use a different email.')), 15000)
      );

      // Race the email sending against the timeout
      await Promise.race([
        transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: `[JewelTrack] ${otp} is your verification code`,
          text: `Your verification code is ${otp}. It expires in 10 minutes.`,
          html: `
            <div style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-image: url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop'); background-size: cover; background-position: center; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
                      <tr>
                        <td style="background-color: rgba(15, 23, 42, 0.85); padding: 60px 40px; text-align: center;">
                          <!-- Logo Section -->
                          <div style="margin-bottom: 40px;">
                            <span style="background-color: #eab308; color: #0f172a; padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 24px; letter-spacing: 1px;">JewelTrack</span>
                          </div>

                          <!-- Content Section -->
                          <h1 style="color: #ffffff; font-size: 32px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.5px;">Verify Your Email</h1>
                          <p style="color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6; margin-bottom: 40px; max-width: 400px; margin-left: auto; margin-right: auto;">
                            Securely manage your jewelry empire. Use the code below to complete your registration.
                          </p>

                          <!-- OTP Card -->
                          <div style="text-align: center; margin-bottom: 40px;">
                            <div style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 32px; display: inline-block; backdrop-filter: blur(10px);">
                              <span style="font-size: 48px; font-weight: 800; color: #eab308; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace;">${otp}</span>
                            </div>
                          </div>

                          <p style="color: rgba(255, 255, 255, 0.5); font-size: 14px; margin-bottom: 0;">
                            Valid for <strong style="color: #ffffff;">10 minutes</strong>
                          </p>
                        </td>
                      </tr>
                      <!-- Footer Section -->
                      <tr>
                        <td style="background-color: rgba(0, 0, 0, 0.4); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                          <div style="margin-bottom: 20px;">
                            <table border="0" cellpadding="0" cellspacing="0" align="center">
                              <tr>
                                <td style="padding: 0 10px;">
                                  <span style="color: #eab308; font-size: 12px; font-weight: 700; text-transform: uppercase; tracking-wider: 1px;">10k+ Stores</span>
                                </td>
                                <td style="width: 1px; background-color: rgba(255, 255, 255, 0.2); height: 12px;"></td>
                                <td style="padding: 0 10px;">
                                  <span style="color: #eab308; font-size: 12px; font-weight: 700; text-transform: uppercase; tracking-wider: 1px;">99.9% Uptime</span>
                                </td>
                              </tr>
                            </table>
                          </div>
                          <p style="color: rgba(255, 255, 255, 0.4); font-size: 11px; margin-bottom: 12px;">
                            Developed by <a href="https://op-shashikant.vercel.app" style="color: #ffffff; text-decoration: underline; font-weight: 600;">Shashikant</a>
                          </p>
                          <p style="color: rgba(255, 255, 255, 0.3); font-size: 10px; margin: 0;">
                            Support: <a href="mailto:officialjeweltrack@gmail.com" style="color: rgba(255, 255, 255, 0.5); text-decoration: none;">officialjeweltrack@gmail.com</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>
          `
        }),
        timeoutPromise
      ]);
      console.log(`[OTP] Successfully sent to ${email}`);
    } catch (mailError: any) {
      console.error('[OTP] Mail/Timeout Error:', mailError.message);
      console.error(`[OTP] Fallback - OTP for ${email} is ${otp} (valid 10 min) - master OTP 123456 also works`);
      // Don't throw - OTP is saved in DB and master OTP 123456 works as fallback
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/verify-otp', async (req: express.Request, res: express.Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    // MASTER OTP for testing (123456)
    if (otp === '123456') {
      const record = await EmailVerification.findOne({ where: { email } });
      if (record) {
        await record.update({ verified: true });
      } else {
        await EmailVerification.create({ 
          id: uuidv4(), 
          email, 
          otp: '123456', 
          expires_at: new Date(Date.now() + 60 * 60 * 1000), 
          verified: true 
        });
      }
      return res.json({ success: true });
    }

    const record = await EmailVerification.findOne({ where: { email } });
    if (!record) return res.status(400).json({ success: false, message: 'No verification request found' });
    if (record.getDataValue('verified')) return res.json({ success: true });
    if (record.getDataValue('otp') !== otp) return res.status(400).json({ success: false, message: 'Invalid code' });
    if (new Date(record.getDataValue('expires_at')) < new Date()) return res.status(400).json({ success: false, message: 'Code expired' });
    await record.update({ verified: true });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- FORGOT PASSWORD FLOW ---
app.post('/api/auth/forgot-password/send-otp', async (req: express.Request, res: express.Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email. Please register first.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const existing = await EmailVerification.findOne({ where: { email } });
    if (existing) {
      await existing.update({ otp, expires_at: expiresAt, verified: false });
    } else {
      await EmailVerification.create({ id: uuidv4(), email, otp, expires_at: expiresAt, verified: false });
    }

    console.log(`[ForgotPassword OTP] Sending request for: ${email}`);
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email server timed out. Check your SMTP settings or use a different email.')), 15000)
      );
      await Promise.race([
        transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: `[JewelTrack] ${otp} is your password reset code`,
          text: `Your password reset code is ${otp}. It expires in 10 minutes. If you didn't request this, ignore this email.`,
          html: `
            <div style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-size: cover; background-position: center; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
                      <tr>
                        <td style="background-color: #1e293b; padding: 60px 40px; text-align: center;">
                          <div style="margin-bottom: 40px;">
                            <span style="background-color: #eab308; color: #0f172a; padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 24px; letter-spacing: 1px;">JewelTrack</span>
                          </div>
                          <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin-bottom: 16px;">Reset Your Password</h1>
                          <p style="color: rgba(255, 255, 255, 0.7); font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
                            We received a request to reset your password. Use the code below to set a new password.
                          </p>
                          <div style="text-align: center; margin-bottom: 32px;">
                            <div style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 28px; display: inline-block;">
                              <span style="font-size: 42px; font-weight: 800; color: #eab308; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace;">${otp}</span>
                            </div>
                          </div>
                          <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; margin-bottom: 0;">
                            Valid for <strong style="color: #ffffff;">10 minutes</strong> • Don't share this code
                          </p>
                          <p style="color: rgba(255, 255, 255, 0.4); font-size: 12px; margin-top: 16px;">
                            If you didn't request this, you can safely ignore this email.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color: rgba(0, 0, 0, 0.4); padding: 24px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                          <p style="color: rgba(255, 255, 255, 0.3); font-size: 10px; margin: 0;">
                            Support: <a href="mailto:officialjeweltrack@gmail.com" style="color: rgba(255, 255, 255, 0.5); text-decoration: none;">officialjeweltrack@gmail.com</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>
          `
        }),
        timeoutPromise
      ]);
      console.log(`[ForgotPassword OTP] Successfully sent to ${email}`);
    } catch (mailError: any) {
      console.error('[ForgotPassword OTP] Mail/Timeout Error:', mailError.message);
      console.error(`[ForgotPassword OTP] Fallback - OTP for ${email} is ${otp} (valid 10 min) - master OTP 123456 also works`);
    }

    res.json({ success: true, message: 'OTP sent to your registered email' });
  } catch (error: any) {
    console.error('Forgot Password Send OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/forgot-password/verify-otp', async (req: express.Request, res: express.Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    if (otp === '123456') {
      const record = await EmailVerification.findOne({ where: { email } });
      if (record) {
        await record.update({ verified: true });
      } else {
        await EmailVerification.create({
          id: uuidv4(),
          email,
          otp: '123456',
          expires_at: new Date(Date.now() + 60 * 60 * 1000),
          verified: true
        });
      }
      return res.json({ success: true, message: 'OTP verified' });
    }

    const record = await EmailVerification.findOne({ where: { email } });
    if (!record) return res.status(400).json({ success: false, message: 'No verification request found. Please request OTP first.' });
    if (record.getDataValue('otp') !== otp) return res.status(400).json({ success: false, message: 'Invalid code' });
    if (new Date(record.getDataValue('expires_at')) < new Date()) return res.status(400).json({ success: false, message: 'Code expired. Please request a new one.' });
    await record.update({ verified: true });
    res.json({ success: true, message: 'OTP verified' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/reset-password', async (req: express.Request, res: express.Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
    if (String(newPassword).length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Verify OTP (allow master OTP 123456)
    if (otp !== '123456') {
      const record = await EmailVerification.findOne({ where: { email } });
      if (!record) return res.status(400).json({ success: false, message: 'No OTP request found. Please request OTP again.' });
      // If already verified via previous verify-otp call, allow; otherwise check otp
      const isVerified = record.getDataValue('verified');
      const storedOtp = record.getDataValue('otp');
      const expiresAt = new Date(record.getDataValue('expires_at'));
      if (!isVerified) {
        if (storedOtp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
        if (expiresAt < new Date()) return res.status(400).json({ success: false, message: 'OTP expired' });
      } else {
        // If verified flag true, still ensure either otp matches stored or is 123456 (already handled)
        // Allow any verified record within expiry to reset, but still validate if otp provided doesn't match and not master
        if (storedOtp !== otp && otp !== '123456') {
          // Allow verified flow: if user already verified via /verify-otp, don't require exact match
          // So we skip strict check when verified=true
        }
        if (expiresAt < new Date()) return res.status(400).json({ success: false, message: 'OTP expired' });
      }
    } else {
      // Master OTP - ensure record exists or create verified one
      const record = await EmailVerification.findOne({ where: { email } });
      if (record) {
        await record.update({ verified: true });
      } else {
        await EmailVerification.create({
          id: uuidv4(),
          email,
          otp: '123456',
          expires_at: new Date(Date.now() + 60 * 60 * 1000),
          verified: true
        });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash: passwordHash });

    // Invalidate OTP after successful reset
    await EmailVerification.destroy({ where: { email } });

    res.json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/store', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId } = req.query;
    const store = await Store.findByPk(storeId as string);
    res.json(store);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/users', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId } = req.query;
    const users = await User.findAll({ 
      where: { store_id: storeId as string },
      attributes: { exclude: ['password_hash'] }
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/users', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId, name, email, password, role } = req.body;
    if (!storeId || !name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      id: uuidv4(),
      store_id: storeId,
      name,
      email,
      password_hash: passwordHash,
      role,
      is_active: true
    });

    const userJson = user.toJSON();
    delete (userJson as any).password_hash;
    res.json({ success: true, user: userJson });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/categories', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId } = req.query;
    const categories = await Category.findAll({ where: { store_id: storeId as string } });
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/products', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId } = req.query;
    const products = await Product.findAll({ where: { store_id: storeId as string } });
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/metal-rates', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId) return res.status(400).json({ success: false, message: 'storeId required' });
    console.log("======================================================url", req.url);
    console.log("======================================================storeId", storeId);
    // Find or create the metal rate record
    let [rates, created] = await MetalRate.findOrCreate({
      where: { store_id: storeId as string },
      defaults: {
        id: uuidv4(),
        store_id: storeId as string,
        gold_24k_per_gm: 0,
        gold_22k_per_gm: 0,
        gold_18k_per_gm: 0,
        silver_per_gm: 0,
        platinum_per_gm: 0
      }
    });

    if (created) {
      console.log(`Created default rates for store ${storeId}`);
    } else {
      console.log(`Fetched existing rates for store ${storeId}`);
    }

    res.json({ success: true, rates });
  } catch (error: any) {
    console.error("Error fetching metal rates:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/metal-rates', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId, gold_24k_per_gm, gold_22k_per_gm, gold_18k_per_gm, silver_per_gm, platinum_per_gm } = req.body;
    if (!storeId) return res.status(400).json({ success: false, message: 'storeId required' });
    
    // Find or create the metal rate record
    let [rates, created] = await MetalRate.findOrCreate({
      where: { store_id: storeId as string },
      defaults: {
        id: uuidv4(),
        store_id: storeId as string,
        gold_24k_per_gm: Number(gold_24k_per_gm) || 0,
        gold_22k_per_gm: Number(gold_22k_per_gm) || 0,
        gold_18k_per_gm: Number(gold_18k_per_gm) || 0,
        silver_per_gm: Number(silver_per_gm) || 0,
        platinum_per_gm: Number(platinum_per_gm) || 0
      }
    });

    if (!created) {
      await rates.update({
        gold_24k_per_gm: Number(gold_24k_per_gm) || 0,
        gold_22k_per_gm: Number(gold_22k_per_gm) || 0,
        gold_18k_per_gm: Number(gold_18k_per_gm) || 0,
        silver_per_gm: Number(silver_per_gm) || 0,
        platinum_per_gm: Number(platinum_per_gm) || 0
      });
    }

    console.log(`${created ? 'Created' : 'Updated'} rates for store ${storeId}:`, rates.toJSON());
    res.json({ success: true, rates });
  } catch (error: any) {
    console.error("Error updating metal rates:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get('/api/customers', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId } = req.query;
    const customers = await Customer.findAll({ where: { store_id: storeId as string } });
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/invoices', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId } = req.query;
    const invoices = await Invoice.findAll({ 
      where: { store_id: storeId as string },
      include: [{ model: InvoiceItem, as: 'items' }]
    });
    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/repairs', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId } = req.query;
    const repairs = await RepairOrder.findAll({ where: { store_id: storeId as string } });
    res.json(repairs);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/notifications', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId } = req.query;
    const notifications = await Notification.findAll({ 
      where: { store_id: storeId as string },
      order: [['created_at', 'DESC']],
      limit: 50
    });
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/notifications', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId, product_id, title, message, type } = req.body;
    const notification = await Notification.create({
      id: uuidv4(), store_id: storeId, product_id: product_id || null, title, message, type: type || 'other'
    });
    res.json({ success: true, notification });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/notifications/:id/read', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    await Notification.update({ is_read: true }, { where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/notifications/:id/acknowledge', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    await Notification.update({ is_acknowledged: true, is_read: true }, { where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/notifications/read-all', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId } = req.body;
    await Notification.update({ is_read: true }, { where: { store_id: storeId, is_read: false } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/api/notifications/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    await Notification.destroy({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/products', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId, ...productData } = req.body;
    const nowMonth = new Date().toISOString().slice(0,7);
    let quota = await StoreQuota.findOne({ where: { store_id: storeId } });
    if (!quota) {
      quota = await StoreQuota.create({ id: uuidv4(), store_id: storeId, usage_month: nowMonth });
    } else if (quota.getDataValue('usage_month') !== nowMonth) {
      await quota.update({ usage_month: nowMonth, products_this_month: 0, invoices_this_month: 0 });
    }
    let planStatus = quota.getDataValue('plan_status');
    const planName = quota.getDataValue('plan_name');
    const premiumUntil: Date | null = quota.getDataValue('premium_expires_at');
    const now = new Date();
    const isPremiumActive = planStatus === 'active' && planName === 'premium' && premiumUntil && new Date(premiumUntil) > now;
    const productLimit = isPremiumActive ? 500 : 100;
    const productsCount = quota.getDataValue('products_this_month');
    if (planStatus === 'locked') return res.status(402).json({ success: false, message: 'Upgrade required to add products' });
    if (planStatus === 'trial' && quota.getDataValue('trial_remaining') <= 0) {
      return res.status(402).json({ success: false, message: 'Trial ended. Upgrade required to add products' });
    }
    if (planStatus === 'active' && productsCount >= productLimit) {
      return res.status(402).json({ success: false, message: `Product limit reached for this month (${productLimit}). Upgrade cycle next month.` });
    }
    const product = await Product.create({
      ...productData,
      id: uuidv4(),
      store_id: storeId,
    });
    if (planStatus === 'trial' && quota.getDataValue('trial_remaining') > 0) {
      await quota.update({ trial_remaining: quota.getDataValue('trial_remaining') }); // trial counters used for invoices only
    }
    await quota.update({ products_this_month: productsCount + 1 });
    res.json({ success: true, product });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/products/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const productData = req.body;
    
    await sequelize.transaction(async (t) => {
      await Product.update(productData, { where: { id }, transaction: t });

      if (productData.quantity > (productData.min_stock_alert || 0)) {
        await Notification.update({ is_resolved: true }, { 
          where: { product_id: id, type: 'low_stock', is_resolved: false },
          transaction: t
        });
      }
    });

    const product = await Product.findByPk(id);
    res.json({ success: true, product });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/api/products/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    await Product.destroy({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/store/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const storeData = req.body;
    await Store.update(storeData, { where: { id } });
    const updatedStore = await Store.findByPk(id);
    res.json({ success: true, store: updatedStore });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/store/:id/preferences', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { preferences } = req.body;
    await Store.update({ preferences }, { where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/store/:id/sub-prompt-ts', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { sub_prompt_ts } = req.body;
    await Store.update({ sub_prompt_ts }, { where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/users/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { password, ...userData } = req.body;
    
    if (password) {
      userData.password_hash = await bcrypt.hash(password, 10);
    }
    
    await User.update(userData, { where: { id } });
    const updatedUser = await User.findByPk(id, { attributes: { exclude: ['password_hash'] } });
    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/categories', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId, ...categoryData } = req.body;
    const category = await Category.create({
      ...categoryData,
      id: uuidv4(),
      store_id: storeId
    });
    res.json({ success: true, category });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/api/categories/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    await Category.destroy({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/register', async (req: express.Request, res: express.Response) => {
  try {
    const { storeName, userName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists. Please sign in instead.' });
    }

    const verification = await EmailVerification.findOne({ where: { email } });
    if (!verification || !verification.getDataValue('verified')) {
      return res.status(400).json({ success: false, message: 'Email not verified. Please verify with OTP.' });
    }
    const storeId = uuidv4();
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    await sequelize.transaction(async (t) => {
      await Store.create({ id: storeId, name: storeName }, { transaction: t });
      await User.create({ id: userId, store_id: storeId, name: userName, email, password_hash: passwordHash, role: 'owner' }, { transaction: t });
      
      await Category.bulkCreate([
        { id: uuidv4(), store_id: storeId, name: 'Gold Rings', metal_type: 'gold', description: 'Gold ring collection' },
        { id: uuidv4(), store_id: storeId, name: 'Gold Necklaces', metal_type: 'gold', description: 'Gold necklace sets' },
        { id: uuidv4(), store_id: storeId, name: 'Silver Items', metal_type: 'silver', description: 'Silver jewelry and articles' },
        { id: uuidv4(), store_id: storeId, name: 'Diamond Jewelry', metal_type: 'gold', description: 'Diamond studded pieces' },
        { id: uuidv4(), store_id: storeId, name: 'Bangles', metal_type: 'gold', description: 'Gold and diamond bangles' },
      ], { transaction: t });

      // Clean up verification record
      await EmailVerification.destroy({ where: { email }, transaction: t });
    });

    const user = await User.findByPk(userId, { attributes: { exclude: ['password_hash'] } });
    const token = jwt.sign({ id: user?.getDataValue('id'), role: user?.getDataValue('role'), store_id: user?.getDataValue('store_id') }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, user, token });
  } catch (error: any) {
    console.error('Registration error:', error);
    let message = error.message;
    if (error.name === 'SequelizeUniqueConstraintError') {
      message = 'A user or store with these details already exists.';
    }
    res.status(400).json({ success: false, message });
  }
});

app.post('/api/login', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email, is_active: true } });
    
    if (user && await bcrypt.compare(password, user.getDataValue('password_hash'))) {
      const userJson = user.toJSON();
      delete (userJson as any).password_hash;
      const token = jwt.sign({ id: user.getDataValue('id'), role: user.getDataValue('role'), store_id: user.getDataValue('store_id') }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ success: true, user: userJson, token });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/logout', (req: express.Request, res: express.Response) => {
  res.json({ success: true });
});

app.get('/api/dashboard/stats', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId) return res.status(400).json({ success: false, message: 'storeId is required' });

    // Execute multiple queries in parallel for maximum speed
    const [
      totalSalesResult,
      activeRepairs,
      lowStock,
      customersCount,
      metalSalesRaw
    ] = await Promise.all([
      Invoice.sum('total_amount', { where: { store_id: storeId as string } }),
      RepairOrder.count({ 
        where: { 
          store_id: storeId as string,
          status: { [Op.ne]: 'delivered' }
        } 
      }),
      Product.count({ 
        where: { 
          store_id: storeId as string,
          quantity: { [Op.lte]: sequelize.col('min_stock_alert') }
        } 
      }),
      Customer.count({ where: { store_id: storeId as string } }),
      InvoiceItem.findAll({
        attributes: ['metal_type', [sequelize.fn('SUM', sequelize.col('total_price')), 'total']],
        include: [{
          model: Invoice,
          as: 'invoice',
          where: { store_id: storeId as string },
          attributes: []
        }],
        group: ['metal_type'],
        raw: true
      })
    ]);

    // Optimized 7-day sales aggregation (Single query vs 7 separate queries)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentInvoices = await Invoice.findAll({
      attributes: [
        'invoice_date',
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'daily_total']
      ],
      where: {
        store_id: storeId as string,
        invoice_date: { [Op.gte]: sevenDaysAgo.toISOString().split('T')[0] }
      },
      group: ['invoice_date'],
      order: [['invoice_date', 'ASC']],
      raw: true
    }) as unknown as { invoice_date: string, daily_total: number }[];

    // Map to last 7 days including zeros
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayData = recentInvoices.find(inv => inv.invoice_date === dateStr);
      last7Days.push({ day: dayName, amount: dayData ? Number(dayData.daily_total) : 0 });
    }

    const metalColors: Record<string, string> = {
      gold: 'hsl(38, 92%, 50%)',
      silver: 'hsl(215, 20%, 65%)',
      platinum: 'hsl(217, 91%, 60%)',
      diamond: 'hsl(190, 91%, 60%)',
      other: 'hsl(0, 0%, 50%)'
    };

    const salesByMetal = (metalSalesRaw as any[]).map(ms => ({
      name: ms.metal_type ? ms.metal_type.charAt(0).toUpperCase() + ms.metal_type.slice(1) : 'Other',
      value: Number(ms.total) || 0,
      fill: metalColors[ms.metal_type?.toLowerCase()] || metalColors.other
    }));

    if (salesByMetal.length === 0) {
      salesByMetal.push({ name: 'No Sales', value: 0, fill: 'hsl(var(--muted))' });
    }

    res.json({
      totalSales: totalSalesResult || 0,
      activeRepairs,
      lowStock,
      customersCount,
      salesLast7Days: last7Days,
      salesByMetal
    });
  } catch (error: any) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/customers/lookup', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId, phone } = req.query;
    const customer = await Customer.findOne({ where: { store_id: storeId as string, phone: phone as string } });
    res.json(customer || null);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/invoices', async (req: express.Request, res: express.Response) => {
  try {
    const { 
      storeId, customer_id, customer_name, customer_phone, invoice_date, items, subtotal, 
      discount, tax_amount, total_amount, payment_method, 
      payment_status, notes 
    } = req.body;

    const errors: string[] = [];
    const methodAllowed = ['cash', 'card', 'upi', 'bank'];
    const statusAllowed = ['paid', 'pending', 'due'];
    if (!storeId) errors.push('storeId required');
    if (!Array.isArray(items) || items.length === 0) errors.push('At least one item is required');
    if (payment_method && !methodAllowed.includes(String(payment_method).toLowerCase())) errors.push('Invalid payment method');
    if (payment_status && !statusAllowed.includes(String(payment_status).toLowerCase())) errors.push('Invalid payment status');
    const toFloat = (v: any) => Number(v || 0);
    for (const it of Array.isArray(items) ? items : []) {
      if (!(toFloat(it.quantity) >= 1)) { errors.push('Item quantity must be at least 1'); break; }
      if (!(toFloat(it.unit_price) >= 0)) { errors.push('Item unit_price must be non-negative'); break; }
    }
    if (errors.length) return res.status(400).json({ success: false, message: errors[0] });

    const rates = await (async () => {
      const r = await MetalRate.findOne({ where: { store_id: storeId as string } });
      return r;
    })();
    const metalRateObj = rates ? {
      gold_24k_per_gm: Number(rates.getDataValue('gold_24k_per_gm') || 0),
      gold_22k_per_gm: Number(rates.getDataValue('gold_22k_per_gm') || 0),
      gold_18k_per_gm: Number(rates.getDataValue('gold_18k_per_gm') || 0),
      silver_per_gm: Number(rates.getDataValue('silver_per_gm') || 0),
      platinum_per_gm: Number(rates.getDataValue('platinum_per_gm') || 0),
    } : null;
    if (!metalRateObj) {
      return res.status(400).json({ success: false, message: 'Metal rates not configured. Set rates in Settings.' });
    }
    const productIds = items.map((it: any) => it.product_id).filter((id: any) => !!id);
    const productsMap: Record<string, any> = {};
    if (productIds.length) {
      const dbProducts = await Product.findAll({ where: { id: productIds } });
      for (const p of dbProducts) productsMap[p.getDataValue('id')] = p;
    }
    const computePerGm = (metal: string, karat: string) => {
      const m = (metal || '').toLowerCase();
      const k = parseInt(String(karat || '').replace(/[^0-9]/g, ''), 10) || 0;
      if (m === 'gold') {
        if (k >= 24) return metalRateObj.gold_24k_per_gm;
        if (k >= 22) return metalRateObj.gold_22k_per_gm;
        if (k >= 18) return metalRateObj.gold_18k_per_gm;
        return 0;
      }
      if (m === 'silver') return metalRateObj.silver_per_gm;
      if (m === 'platinum') return metalRateObj.platinum_per_gm;
      return 0;
    };
    const computedItems: any[] = [];
    let computedSubtotal = 0;
    let computedDiscount = 0;
    for (const it of items) {
      const qty = toFloat(it.quantity);
      const weight = toFloat(it.weight);
      const disc = toFloat(it.discount_percent);
      const perGm = computePerGm(it.metal_type, it.karat);
      const prod = it.product_id ? productsMap[it.product_id] : null;
      const makingCharges = Number(it.making_charges ?? prod?.getDataValue('making_charges') ?? 0);
      const metalP = Number(it.metal_price ?? (weight * perGm));
      const unit = Math.max(0, Math.round((metalP + makingCharges) * 100) / 100);
      const lineBase = unit * qty;
      const lineDiscount = lineBase * (disc / 100);
      const lineTotal = Math.max(0, Math.round((lineBase - lineDiscount) * 100) / 100);
      computedSubtotal += lineBase;
      computedDiscount += lineDiscount;
      computedItems.push({
        ...it,
        metal_price: metalP,
        making_charges: makingCharges,
        unit_price: unit,
        total_price: lineTotal
      });
    }
    computedSubtotal = Math.round(computedSubtotal * 100) / 100;
    computedDiscount = Math.round(computedDiscount * 100) / 100;
    const taxAmountFinal = toFloat(tax_amount);
    const computedTotal = Math.round((computedSubtotal - computedDiscount + taxAmountFinal) * 100) / 100;

    const nowMonth = new Date().toISOString().slice(0,7);
    let quota = await StoreQuota.findOne({ where: { store_id: storeId } });
    if (!quota) {
      quota = await StoreQuota.create({ id: uuidv4(), store_id: storeId, usage_month: nowMonth });
    } else if (quota.getDataValue('usage_month') !== nowMonth) {
      await quota.update({ usage_month: nowMonth, products_this_month: 0, invoices_this_month: 0 });
    }
    let planStatus = quota.getDataValue('plan_status');
    const planName = quota.getDataValue('plan_name');
    const premiumUntil: Date | null = quota.getDataValue('premium_expires_at');
    const nowCheck = new Date();
    const isPremiumActive2 = planStatus === 'active' && planName === 'premium' && premiumUntil && new Date(premiumUntil) > nowCheck;
    const invoiceLimit = isPremiumActive2 ? 1000 : 200;
    const invoicesCount = quota.getDataValue('invoices_this_month');
    if (planStatus === 'locked') return res.status(402).json({ success: false, message: 'Upgrade required to generate invoices' });
    if (planStatus === 'trial') {
      if (quota.getDataValue('trial_remaining') <= 0) {
        return res.status(402).json({ success: false, message: 'Trial ended. Upgrade required to generate invoices' });
      }
    } else if (planStatus === 'active' && invoicesCount >= invoiceLimit) {
      return res.status(402).json({ success: false, message: `Invoice limit reached for this month (${invoiceLimit}). Upgrade cycle next month.` });
    }

    const invoiceId = uuidv4();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    const prefix = `INV-${dateStr}-`;
    let finalInvoiceNumber: string | null = null;
    const latestSameDay = await Invoice.findOne({
      where: { store_id: storeId, invoice_number: { [Op.like]: `${prefix}%` } },
      order: [['invoice_number', 'DESC']]
    });
    let seqNum = 1;
    if (latestSameDay) {
      const parts = String((latestSameDay as any).invoice_number).split('-');
      const lastSeq = parseInt(parts[parts.length - 1] || '0', 10);
      if (!isNaN(lastSeq)) seqNum = lastSeq + 1;
    }

    await sequelize.transaction(async (t) => {
      let finalCustomerId = customer_id;

      if (!finalCustomerId && customer_phone) {
        const existingCustomer = await Customer.findOne({ where: { store_id: storeId, phone: customer_phone }, transaction: t });
        if (existingCustomer) {
          finalCustomerId = existingCustomer.getDataValue('id');
        } else if (customer_name) {
          finalCustomerId = uuidv4();
          await Customer.create({ id: finalCustomerId, store_id: storeId, name: customer_name, phone: customer_phone }, { transaction: t });
        }
      }

      let created = false;
      let attempts = 0;
      while (!created && attempts < 10) {
        const invoice_number = `${prefix}${String(seqNum).padStart(4, '0')}`;
        try {
          await Invoice.create({
            id: invoiceId, store_id: storeId, customer_id: finalCustomerId || null, invoice_number, invoice_date,
            subtotal: computedSubtotal, discount: computedDiscount, tax_amount: taxAmountFinal, total_amount: computedTotal, payment_method, payment_status, notes
          }, { transaction: t });
          finalInvoiceNumber = invoice_number;
          created = true;
        } catch (e: any) {
          const dup =
            e?.code === 'ER_DUP_ENTRY' ||
            e?.name === 'SequelizeUniqueConstraintError' ||
            e?.parent?.code === 'ER_DUP_ENTRY';
          if (dup) {
            seqNum++;
            attempts++;
            continue;
          }
          throw e;
        }
      }

      for (const item of computedItems) {
        await InvoiceItem.create({
          id: uuidv4(), invoice_id: invoiceId, product_id: item.product_id, product_name: item.product_name,
          quantity: item.quantity, unit_price: item.unit_price, metal_price: item.metal_price, making_charges: item.making_charges,
          discount_percent: item.discount_percent || 0,
          total_price: item.total_price, metal_type: item.metal_type, karat: item.karat, weight: item.weight
        }, { transaction: t });
        
        if (item.product_id) {
          await Product.decrement('quantity', { by: item.quantity, where: { id: item.product_id }, transaction: t });
        }
      }

      if (finalCustomerId) {
        await Customer.increment('total_purchases', { by: computedTotal, where: { id: finalCustomerId }, transaction: t });
      }
    });

    if (planStatus === 'trial' && quota.getDataValue('trial_remaining') > 0) {
      await quota.update({ trial_remaining: quota.getDataValue('trial_remaining') - 1 });
    } else {
      await quota.update({ invoices_this_month: invoicesCount + 1 });
    }

    res.json({ 
      success: true, 
      invoice_id: invoiceId, 
      invoice_number: finalInvoiceNumber,
      items: computedItems 
    });
  } catch (error: any) {
    console.error('Invoice error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/invoices/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id, { 
      include: [
        { model: InvoiceItem, as: 'items' },
        Customer
      ] 
    });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json(invoice);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Subscription status
app.get('/api/subscription/status', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId } = req.query;
    let quota = await StoreQuota.findOne({ where: { store_id: storeId as string } });
    if (!quota) {
      quota = await StoreQuota.create({ id: uuidv4(), store_id: storeId as string });
    }
    res.json({
      success: true,
      plan_status: quota.getDataValue('plan_status'),
      plan_name: quota.getDataValue('plan_name'),
      plan_started_at: quota.getDataValue('plan_started_at'),
      usage_month: quota.getDataValue('usage_month'),
      invoices_this_month: quota.getDataValue('invoices_this_month'),
      products_this_month: quota.getDataValue('products_this_month'),
      trial_remaining: quota.getDataValue('trial_remaining'),
      premium_expires_at: quota.getDataValue('premium_expires_at'),
      onboarding_offer_claimed: quota.getDataValue('onboarding_offer_claimed')
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/subscription/offer-status', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId) return res.status(400).json({ success: false, message: 'storeId required' });
    let quota = await StoreQuota.findOne({ where: { store_id: storeId as string } });
    if (!quota) {
      quota = await StoreQuota.create({ id: uuidv4(), store_id: storeId as string });
    }
    const claimed = quota.getDataValue('onboarding_offer_claimed');
    const eligible = !claimed;
    res.json({ success: true, eligible, claimed });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/subscription/claim-onboarding', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId } = req.body;
    if (!storeId) return res.status(400).json({ success: false, message: 'storeId required' });
    let quota = await StoreQuota.findOne({ where: { store_id: storeId as string } });
    if (!quota) {
      quota = await StoreQuota.create({ id: uuidv4(), store_id: storeId as string });
    }
    const now = new Date();
    const expires = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days
    await quota.update({
      plan_status: 'active',
      plan_name: 'premium',
      plan_started_at: now,
      premium_expires_at: expires,
      onboarding_offer_claimed: true
    });
    res.json({ success: true, premium_expires_at: expires.toISOString() });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/subscription/qr', async (req: express.Request, res: express.Response) => {
  try {
    const storeId = req.query.storeId as string;
    if (!storeId) return res.status(400).send('storeId required');
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).send('Razorpay keys not configured');
    }
    let quota = await StoreQuota.findOne({ where: { store_id: storeId } });
    if (!quota) {
      quota = await StoreQuota.create({ id: uuidv4(), store_id: storeId });
    }
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    let shortUrl: string | null = null;
    const existingLinkId = quota.getDataValue('payment_link_id');
    if (existingLinkId) {
      const checkResp = await fetch(`https://api.razorpay.com/v1/payment_links/${existingLinkId}`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      const checkData = await checkResp.json();
      if (checkResp.status >= 200 && checkResp.status < 300 && checkData.short_url) {
        if (['cancelled','expired'].includes(checkData.status)) {
          shortUrl = null;
        } else {
          shortUrl = checkData.short_url;
        }
      }
    }
    if (!shortUrl) {
      const payload = {
        amount: SUBSCRIPTION_AMOUNT_PAISE,
        currency: 'INR',
        description: SUBSCRIPTION_DESCRIPTION,
        notes: { storeId },
        callback_url: `${BASE_URL}/api/subscription/verify`,
        callback_method: 'get'
      };
      const plResp = await fetch('https://api.razorpay.com/v1/payment_links', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const plData = await plResp.json();
      if (plResp.status >= 200 && plResp.status < 300) {
        await quota.update({ payment_link_id: plData.id });
        shortUrl = plData.short_url;
      } else {
        return res.status(400).send(plData.error?.description || 'Failed to create payment link');
      }
    }
    if (!shortUrl) {
      return res.status(400).send('No payment link available');
    }
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(shortUrl)}`;
    const store = await Store.findByPk(storeId);
    const upiId = store?.getDataValue('upi_id') || '';
    const storeName = store?.getDataValue('name') || 'Merchant';
    const upiAmount = (SUBSCRIPTION_AMOUNT_PAISE / 100).toFixed(2);
    const upiLink = upiId ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(storeName)}&am=${encodeURIComponent(upiAmount)}&cu=INR&tn=${encodeURIComponent('JewelTrack Base Plan')}` : '';
    const upiQr = upiLink ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(upiLink)}` : '';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!doctype html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Pay ₹1 - Base Plan</title>
        <style>
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 0; background: #0b132b; color: #fff; }
          .wrap { max-width: 560px; margin: 40px auto; padding: 24px; }
          .card { background: #1c2541; border-radius: 12px; padding: 24px; box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
          h1 { font-size: 20px; margin: 0 0 16px; }
          .qr { display: flex; justify-content: center; padding: 16px; }
          .link { text-align: center; margin-top: 16px; }
          a.btn { display: inline-block; background: #3a86ff; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 8px; }
          .sub { opacity: .8; font-size: 14px; text-align: center; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="card">
            <h1>Scan to Pay ₹1 for Base Plan</h1>
            <div class="qr">
              <img src="${qrUrl}" alt="QR Code" width="280" height="280"/>
            </div>
            <div class="link">
              <a class="btn" href="${shortUrl}" target="_blank" rel="noopener">Open Payment Page</a>
              <div class="sub">After payment, you will be redirected and the plan will activate automatically.</div>
            </div>
          </div>
          ${upiLink ? `
          <div class="card" style="margin-top:16px;">
            <h1>Or Pay ₹1 via UPI</h1>
            <div class="qr">
              <img src="${upiQr}" alt="UPI QR" width="280" height="280"/>
            </div>
            <div class="link">
              <a class="btn" href="${upiLink}">Open UPI App</a>
              <div class="sub">UPI payments do not auto-activate; use Razorpay for automatic activation.</div>
            </div>
          </div>` : ``}
        </div>
      </body>
      </html>
    `);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});
// Create Razorpay payment link for subscription
app.get('/api/subscription/upi', async (req: express.Request, res: express.Response) => {
  try {
    const storeId = req.query.storeId as string;
    if (!storeId) return res.status(400).send('storeId required');
    const store = await Store.findByPk(storeId);
    if (!store) return res.status(404).send('Store not found');
    const upiId = store.getDataValue('upi_id') || '';
    const storeName = store.getDataValue('name') || 'Merchant';
    if (!upiId) return res.status(400).send('Store UPI ID not configured');
    const tn = `JewelTrack Base Plan (${storeId})`;
    const upiAmount2 = (SUBSCRIPTION_AMOUNT_PAISE / 100).toFixed(2);
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(storeName)}&am=${encodeURIComponent(upiAmount2)}&cu=INR&tn=${encodeURIComponent(tn)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(upiLink)}`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!doctype html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Pay ₹1 via UPI</title>
        <style>
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 0; background: #0b132b; color: #fff; }
          .wrap { max-width: 560px; margin: 40px auto; padding: 24px; }
          .card { background: #1c2541; border-radius: 12px; padding: 24px; box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
          h1 { font-size: 20px; margin: 0 0 16px; }
          .qr { display: flex; justify-content: center; padding: 16px; }
          .link { text-align: center; margin-top: 16px; }
          a.btn { display: inline-block; background: #3a86ff; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 8px; }
          .sub { opacity: .8; font-size: 14px; text-align: center; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="card">
            <h1>Scan to Pay ₹1 via UPI</h1>
            <div class="qr">
              <img src="${qrUrl}" alt="UPI QR" width="280" height="280"/>
            </div>
            <div class="link">
              <a class="btn" href="${upiLink}">Open UPI App</a>
              <div class="sub">For automatic activation, use Razorpay link: <a href="/api/subscription/qr?storeId=${storeId}" style="color:#8ecae6">Pay with Razorpay</a></div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});
// Create Razorpay payment link for subscription
app.post('/api/subscription/webhook', express.raw({ type: 'application/json' }), async (req: express.Request, res: express.Response) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(500).send('Webhook secret not configured');
    const signature = req.header('x-razorpay-signature') || '';
    const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
    if (signature !== expected) return res.status(400).send('Signature mismatch');
    const payload = JSON.parse(req.body.toString('utf8'));
    let linkId: string | null = null;
    let storeIdFromNotes: string | null = null;
    if (payload?.payload?.payment_link?.entity?.id) {
      linkId = payload.payload.payment_link.entity.id;
    }
    if (payload?.payload?.payment?.entity?.notes?.storeId) {
      storeIdFromNotes = payload.payload.payment.entity.notes.storeId;
    }
    let quota: StoreQuota | null = null;
    if (linkId) {
      quota = await StoreQuota.findOne({ where: { payment_link_id: linkId } });
    } else if (storeIdFromNotes) {
      quota = await StoreQuota.findOne({ where: { store_id: storeIdFromNotes } });
    }
    if (!quota) return res.status(200).send('ok');
    const paidAmount = Number(payload?.payload?.payment?.entity?.amount) || 0;
    const currency = payload?.payload?.payment?.entity?.currency || '';
    const status = payload?.payload?.payment?.entity?.status || '';
    if ((status === 'captured' || status === 'authorized') && paidAmount === SUBSCRIPTION_AMOUNT_PAISE && currency === 'INR') {
      const amountInRupees = paidAmount / 100;
      await quota.update({ 
        plan_status: 'active', 
        plan_started_at: new Date(), 
        plan_name: 'base',
        total_revenue_paid: (quota.getDataValue('total_revenue_paid') || 0) + amountInRupees
      });
    }
    res.status(200).send('ok');
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});
// Create Razorpay payment link for subscription
app.post('/api/subscription/payment-link', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId } = req.body;
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(400).json({ success: false, message: 'Razorpay keys not configured' });
    }
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const payload = {
      amount: SUBSCRIPTION_AMOUNT_PAISE,
      currency: 'INR',
      description: SUBSCRIPTION_DESCRIPTION,
      notes: { storeId },
      callback_url: `${BASE_URL}/api/subscription/verify`,
      callback_method: 'get'
    };
    const resp = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (resp.status >= 200 && resp.status < 300) {
      let quota = await StoreQuota.findOne({ where: { store_id: storeId as string } });
      if (!quota) {
        quota = await StoreQuota.create({ id: uuidv4(), store_id: storeId as string });
      }
      await quota.update({ payment_link_id: data.id });
      res.json({ success: true, short_url: data.short_url });
    } else {
      res.status(400).json({ success: false, message: data.error?.description || 'Failed to create payment link' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const verifySubscription = async (req: express.Request, res: express.Response) => {
  try {
    const storeId = (req.body.storeId || req.query.storeId) as string;
    const incomingLinkId = (req.query.razorpay_payment_link_id || req.body.payment_link_id) as string;
    const callbackStatus = (req.query.razorpay_payment_link_status || req.body.razorpay_payment_link_status) as string;

    let quota: StoreQuota | null = null;
    let linkId: string | null = null;

    if (storeId) {
      quota = await StoreQuota.findOne({ where: { store_id: storeId } });
      if (!quota) return res.status(400).json({ success: false, message: 'No quota record found' });
      linkId = quota.getDataValue('payment_link_id') || null;
    } else if (incomingLinkId) {
      quota = await StoreQuota.findOne({ where: { payment_link_id: incomingLinkId } });
      if (!quota) return res.status(400).json({ success: false, message: 'No quota record found for payment link' });
      linkId = incomingLinkId;
    } else {
      return res.status(400).json({ success: false, message: 'storeId or razorpay_payment_link_id required' });
    }

    if (!linkId) return res.status(400).json({ success: false, message: 'No payment link found. Create a new one.' });
    if (!quota) return res.status(400).json({ success: false, message: 'No quota record found' });
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const plResp = await fetch(`https://api.razorpay.com/v1/payment_links/${linkId}`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    const plData = await plResp.json();
    if (!(plResp.status >= 200 && plResp.status < 300)) {
      return res.status(400).json({ success: false, message: plData.error?.description || 'Failed to verify payment link' });
    }
    const payments = Array.isArray(plData.payments) ? plData.payments : [];
    const hasCapturedPayment = payments.some((p: any) => p && p.status === 'captured');
    const status = plData.status as string;
    const isCompleted = status === 'completed' || status === 'paid' || callbackStatus === 'paid';
    const correctAmount = Number(plData.amount) === SUBSCRIPTION_AMOUNT_PAISE && plData.currency === 'INR';
    if (isCompleted || hasCapturedPayment) {
      if (!correctAmount) {
        return res.status(400).json({ success: false, message: 'Amount mismatch for base plan' });
      }
      const amountInRupees = Number(plData.amount) / 100;
      await quota.update({ 
        plan_status: 'active', 
        plan_started_at: new Date(), 
        plan_name: 'base',
        total_revenue_paid: (quota.getDataValue('total_revenue_paid') || 0) + amountInRupees
      });
      return res.json({ success: true });
    }
    return res.status(402).json({ success: false, message: `Payment not completed. Link status: ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

app.post('/api/subscription/verify', verifySubscription);
app.get('/api/subscription/verify', verifySubscription);
// --- SERVER STARTUP ---

app.put('/api/invoices/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    await Invoice.update(updateData, { where: { id } });
    const updatedInvoice = await Invoice.findByPk(id, { include: [{ model: InvoiceItem, as: 'items' }, Customer] });
    res.json(updatedInvoice);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to TiDB Cloud (MySQL).');
    
    await sequelize.sync();
    const qi = sequelize.getQueryInterface();
    const tableName = StoreQuota.getTableName() as string;
    const schema = await qi.describeTable(tableName);
    if (!('payment_link_id' in schema)) {
      await qi.addColumn(tableName, 'payment_link_id', {
        type: DataTypes.STRING(64),
        allowNull: true
      });
    }
    if (!('onboarding_offer_claimed' in schema)) {
      await qi.addColumn(tableName, 'onboarding_offer_claimed', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
    if (!('premium_expires_at' in schema)) {
      await qi.addColumn(tableName, 'premium_expires_at', {
        type: DataTypes.DATE,
        allowNull: true
      });
    }
    if (!('total_revenue_paid' in schema)) {
      await qi.addColumn(tableName, 'total_revenue_paid', {
        type: DataTypes.FLOAT,
        defaultValue: 0
      });
    }
    if (!('preferences' in schema)) {
      await qi.addColumn(tableName, 'preferences', {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
      });
    }
    if (!('sub_prompt_ts' in schema)) {
      await qi.addColumn(tableName, 'sub_prompt_ts', {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0
      });
    }

    // Store table columns
    const storeTable = Store.getTableName() as string;
    const storeSchema = await qi.describeTable(storeTable);
    if (!('preferences' in storeSchema)) {
      await qi.addColumn(storeTable, 'preferences', {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
      });
    }
    if (!('sub_prompt_ts' in storeSchema)) {
      await qi.addColumn(storeTable, 'sub_prompt_ts', {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0
      });
    }

    // InvoiceItem columns
    const itemTable = InvoiceItem.getTableName() as string;
    const itemSchema = await qi.describeTable(itemTable);
    if (!('metal_price' in itemSchema)) {
      await qi.addColumn(itemTable, 'metal_price', {
        type: DataTypes.FLOAT,
        defaultValue: 0
      });
    }
    if (!('making_charges' in itemSchema)) {
      await qi.addColumn(itemTable, 'making_charges', {
        type: DataTypes.FLOAT,
        defaultValue: 0
      });
    }

    // MetalRate table columns
    const metalTable = MetalRate.getTableName() as string;
    const metalSchema = await qi.describeTable(metalTable);
    const metalColumns = ['gold_24k_per_gm', 'gold_22k_per_gm', 'gold_18k_per_gm', 'silver_per_gm', 'platinum_per_gm'];
    for (const col of metalColumns) {
      if (!(col in metalSchema)) {
        await qi.addColumn(metalTable, col, {
          type: DataTypes.FLOAT,
          defaultValue: 0
        });
      }
    }

    console.log('Models synced with database.');
    
    // Catch-all 404 handler for debugging
    app.use((req: express.Request, res: express.Response) => {
      console.log(`[404] ${req.method} ${req.url}`);
      res.status(404).json({ 
        success: false, 
        message: `Route ${req.method} ${req.url} not found on this server`,
        hint: 'Check if the backend code is up to date on Render.'
      });
    });

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();
