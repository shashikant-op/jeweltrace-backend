"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const sequelize_1 = require("sequelize");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
const SUBSCRIPTION_AMOUNT_PAISE = parseInt(process.env.SUBSCRIPTION_AMOUNT_PAISE || '100', 10);
const SUBSCRIPTION_DESCRIPTION = process.env.SUBSCRIPTION_DESCRIPTION || 'JewelTrack Base Plan - Monthly (₹1 Test)';
const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize Sequelize with TiDB Cloud individual variables
const sequelize = new sequelize_1.Sequelize(process.env.DB_DATABASE || 'test', process.env.DB_USERNAME || 'root', process.env.DB_PASSWORD || '', {
    host: process.env.DB_HOST || 'localhost',
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
});
// --- MODELS ---
class Store extends sequelize_1.Model {
}
Store.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    address: { type: sequelize_1.DataTypes.TEXT },
    gst_number: { type: sequelize_1.DataTypes.STRING(50) },
    phone: { type: sequelize_1.DataTypes.STRING(20) },
    logo_url: { type: sequelize_1.DataTypes.STRING(500) },
    currency: { type: sequelize_1.DataTypes.STRING(10), defaultValue: 'INR' },
    tax_rate: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 3 },
    upi_id: { type: sequelize_1.DataTypes.STRING(100) },
}, { sequelize, modelName: 'store', underscored: true });
class User extends sequelize_1.Model {
}
User.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true },
    store_id: { type: sequelize_1.DataTypes.STRING(36), allowNull: false },
    name: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    email: { type: sequelize_1.DataTypes.STRING(255), unique: true, allowNull: false },
    password_hash: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    role: { type: sequelize_1.DataTypes.ENUM('owner', 'manager', 'salesperson', 'viewer'), allowNull: false },
    avatar_url: { type: sequelize_1.DataTypes.STRING(500) },
    is_active: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, modelName: 'user', underscored: true });
class Category extends sequelize_1.Model {
}
Category.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true },
    store_id: { type: sequelize_1.DataTypes.STRING(36), allowNull: false },
    name: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    metal_type: { type: sequelize_1.DataTypes.ENUM('gold', 'silver', 'platinum', 'other'), allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT },
}, { sequelize, modelName: 'category', underscored: true });
class Product extends sequelize_1.Model {
}
Product.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true },
    store_id: { type: sequelize_1.DataTypes.STRING(36), allowNull: false },
    category_id: { type: sequelize_1.DataTypes.STRING(36) },
    name: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    sku: { type: sequelize_1.DataTypes.STRING(100) },
    barcode: { type: sequelize_1.DataTypes.STRING(100) },
    metal_type: { type: sequelize_1.DataTypes.STRING(50) },
    karat: { type: sequelize_1.DataTypes.STRING(20) },
    gross_weight: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    net_weight: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    stone_type: { type: sequelize_1.DataTypes.STRING(100) },
    stone_weight: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    making_charges: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    purchase_price: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    selling_price: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    quantity: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    min_stock_alert: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    images: {
        type: sequelize_1.DataTypes.JSON,
        defaultValue: []
    },
    status: { type: sequelize_1.DataTypes.STRING(20), defaultValue: 'active' },
}, { sequelize, modelName: 'product', underscored: true });
class Customer extends sequelize_1.Model {
}
Customer.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true },
    store_id: { type: sequelize_1.DataTypes.STRING(36), allowNull: false },
    name: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    phone: { type: sequelize_1.DataTypes.STRING(20) },
    email: { type: sequelize_1.DataTypes.STRING(255) },
    address: { type: sequelize_1.DataTypes.TEXT },
    anniversary_date: { type: sequelize_1.DataTypes.STRING(20) },
    birthday: { type: sequelize_1.DataTypes.STRING(20) },
    total_purchases: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    loyalty_points: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    notes: { type: sequelize_1.DataTypes.TEXT },
}, { sequelize, modelName: 'customer', underscored: true });
class Invoice extends sequelize_1.Model {
}
Invoice.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true },
    store_id: { type: sequelize_1.DataTypes.STRING(36), allowNull: false },
    customer_id: { type: sequelize_1.DataTypes.STRING(36) },
    invoice_number: { type: sequelize_1.DataTypes.STRING(50), unique: true, allowNull: false },
    invoice_date: { type: sequelize_1.DataTypes.STRING(20) },
    subtotal: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    discount: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    tax_amount: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    total_amount: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    payment_method: { type: sequelize_1.DataTypes.STRING(50) },
    payment_status: { type: sequelize_1.DataTypes.STRING(50) },
    notes: { type: sequelize_1.DataTypes.TEXT },
}, { sequelize, modelName: 'invoice', underscored: true });
class InvoiceItem extends sequelize_1.Model {
}
InvoiceItem.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true },
    invoice_id: { type: sequelize_1.DataTypes.STRING(36), allowNull: false },
    product_id: { type: sequelize_1.DataTypes.STRING(36) },
    product_name: { type: sequelize_1.DataTypes.STRING(255) },
    quantity: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 1 },
    unit_price: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    discount_percent: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    total_price: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    metal_type: { type: sequelize_1.DataTypes.STRING(50) },
    karat: { type: sequelize_1.DataTypes.STRING(20) },
    weight: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
}, { sequelize, modelName: 'invoice_item', underscored: true });
class RepairOrder extends sequelize_1.Model {
}
RepairOrder.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true },
    store_id: { type: sequelize_1.DataTypes.STRING(36), allowNull: false },
    customer_id: { type: sequelize_1.DataTypes.STRING(36) },
    order_number: { type: sequelize_1.DataTypes.STRING(50), unique: true, allowNull: false },
    item_description: { type: sequelize_1.DataTypes.TEXT },
    issue_description: { type: sequelize_1.DataTypes.TEXT },
    photos: {
        type: sequelize_1.DataTypes.JSON,
        defaultValue: []
    },
    assigned_to: { type: sequelize_1.DataTypes.STRING(36) },
    estimated_date: { type: sequelize_1.DataTypes.STRING(20) },
    advance_amount: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    total_estimate: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    status: { type: sequelize_1.DataTypes.STRING(50) },
}, { sequelize, modelName: 'repair_order', underscored: true });
class Notification extends sequelize_1.Model {
}
Notification.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true },
    store_id: { type: sequelize_1.DataTypes.STRING(36), allowNull: false },
    product_id: { type: sequelize_1.DataTypes.STRING(36) },
    title: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    message: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    type: { type: sequelize_1.DataTypes.ENUM('low_stock', 'repair', 'system', 'other'), allowNull: false },
    is_read: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    is_acknowledged: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    is_resolved: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, modelName: 'notification', underscored: true });
// Subscription / Quota tracking per store
class StoreQuota extends sequelize_1.Model {
}
StoreQuota.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true },
    store_id: { type: sequelize_1.DataTypes.STRING(36), allowNull: false, unique: true },
    usage_month: { type: sequelize_1.DataTypes.STRING(7), allowNull: false, defaultValue: () => new Date().toISOString().slice(0, 7) },
    invoices_this_month: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    products_this_month: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    plan_status: { type: sequelize_1.DataTypes.ENUM('trial', 'active', 'locked'), defaultValue: 'trial' },
    plan_name: { type: sequelize_1.DataTypes.STRING(20), defaultValue: 'base' },
    trial_remaining: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 10 },
    plan_started_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    payment_link_id: { type: sequelize_1.DataTypes.STRING(64), allowNull: true },
    onboarding_offer_claimed: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    premium_expires_at: { type: sequelize_1.DataTypes.DATE, allowNull: true }
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
// --- API ENDPOINTS ---
// Email verification model for OTP workflow
class EmailVerification extends sequelize_1.Model {
}
EmailVerification.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true },
    email: { type: sequelize_1.DataTypes.STRING(255), unique: true, allowNull: false },
    otp: { type: sequelize_1.DataTypes.STRING(6), allowNull: false },
    expires_at: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    verified: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, modelName: 'email_verification', underscored: true });
const useGmail = (process.env.SMTP_HOST || '').includes('gmail') || (process.env.SMTP_USER || '').includes('@gmail.com');
const transporter = useGmail
    ? nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    : nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ success: false, message: 'Email is required' });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const existing = await EmailVerification.findOne({ where: { email } });
        if (existing) {
            await existing.update({ otp, expires_at: expiresAt, verified: false });
        }
        else {
            await EmailVerification.create({ id: (0, uuid_1.v4)(), email, otp, expires_at: expiresAt, verified: false });
        }
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: 'Your JewelTrack verification code',
            text: `Your verification code is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp)
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        const record = await EmailVerification.findOne({ where: { email } });
        if (!record)
            return res.status(400).json({ success: false, message: 'No verification request found' });
        if (record.getDataValue('verified'))
            return res.json({ success: true });
        if (record.getDataValue('otp') !== otp)
            return res.status(400).json({ success: false, message: 'Invalid code' });
        if (new Date(record.getDataValue('expires_at')) < new Date())
            return res.status(400).json({ success: false, message: 'Code expired' });
        await record.update({ verified: true });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
app.get('/api/store', async (req, res) => {
    try {
        const { storeId } = req.query;
        const store = await Store.findByPk(storeId);
        res.json(store);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
app.get('/api/users', async (req, res) => {
    try {
        const { storeId } = req.query;
        const users = await User.findAll({
            where: { store_id: storeId },
            attributes: { exclude: ['password_hash'] }
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
app.get('/api/categories', async (req, res) => {
    try {
        const { storeId } = req.query;
        const categories = await Category.findAll({ where: { store_id: storeId } });
        res.json(categories);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
app.get('/api/products', async (req, res) => {
    try {
        const { storeId } = req.query;
        const products = await Product.findAll({ where: { store_id: storeId } });
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
app.get('/api/customers', async (req, res) => {
    try {
        const { storeId } = req.query;
        const customers = await Customer.findAll({ where: { store_id: storeId } });
        res.json(customers);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
app.get('/api/invoices', async (req, res) => {
    try {
        const { storeId } = req.query;
        const invoices = await Invoice.findAll({
            where: { store_id: storeId },
            include: [{ model: InvoiceItem, as: 'items' }]
        });
        res.json(invoices);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
app.get('/api/repairs', async (req, res) => {
    try {
        const { storeId } = req.query;
        const repairs = await RepairOrder.findAll({ where: { store_id: storeId } });
        res.json(repairs);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
app.get('/api/notifications', async (req, res) => {
    try {
        const { storeId } = req.query;
        const notifications = await Notification.findAll({
            where: { store_id: storeId },
            order: [['created_at', 'DESC']],
            limit: 50
        });
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
app.post('/api/notifications', async (req, res) => {
    try {
        const { storeId, product_id, title, message, type } = req.body;
        const notification = await Notification.create({
            id: (0, uuid_1.v4)(), store_id: storeId, product_id: product_id || null, title, message, type: type || 'other'
        });
        res.json({ success: true, notification });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.update({ is_read: true }, { where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.put('/api/notifications/:id/acknowledge', async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.update({ is_acknowledged: true, is_read: true }, { where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.put('/api/notifications/read-all', async (req, res) => {
    try {
        const { storeId } = req.body;
        await Notification.update({ is_read: true }, { where: { store_id: storeId, is_read: false } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.delete('/api/notifications/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.destroy({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.post('/api/products', async (req, res) => {
    try {
        const { storeId, ...productData } = req.body;
        const nowMonth = new Date().toISOString().slice(0, 7);
        let quota = await StoreQuota.findOne({ where: { store_id: storeId } });
        if (!quota) {
            quota = await StoreQuota.create({ id: (0, uuid_1.v4)(), store_id: storeId, usage_month: nowMonth });
        }
        else if (quota.getDataValue('usage_month') !== nowMonth) {
            await quota.update({ usage_month: nowMonth, products_this_month: 0, invoices_this_month: 0 });
        }
        let planStatus = quota.getDataValue('plan_status');
        const planName = quota.getDataValue('plan_name');
        const premiumUntil = quota.getDataValue('premium_expires_at');
        const now = new Date();
        const isPremiumActive = planStatus === 'active' && planName === 'premium' && premiumUntil && new Date(premiumUntil) > now;
        const productLimit = isPremiumActive ? 500 : 100;
        const productsCount = quota.getDataValue('products_this_month');
        if (planStatus === 'locked')
            return res.status(402).json({ success: false, message: 'Upgrade required to add products' });
        if (planStatus === 'trial' && quota.getDataValue('trial_remaining') <= 0) {
            return res.status(402).json({ success: false, message: 'Trial ended. Upgrade required to add products' });
        }
        if (planStatus === 'active' && productsCount >= productLimit) {
            return res.status(402).json({ success: false, message: `Product limit reached for this month (${productLimit}). Upgrade cycle next month.` });
        }
        const product = await Product.create({
            ...productData,
            id: (0, uuid_1.v4)(),
            store_id: storeId,
        });
        if (planStatus === 'trial' && quota.getDataValue('trial_remaining') > 0) {
            await quota.update({ trial_remaining: quota.getDataValue('trial_remaining') }); // trial counters used for invoices only
        }
        await quota.update({ products_this_month: productsCount + 1 });
        res.json({ success: true, product });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.put('/api/products/:id', async (req, res) => {
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
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Product.destroy({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.put('/api/store/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const storeData = req.body;
        await Store.update(storeData, { where: { id } });
        const updatedStore = await Store.findByPk(id);
        res.json({ success: true, store: updatedStore });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { password, ...userData } = req.body;
        if (password) {
            userData.password_hash = await bcryptjs_1.default.hash(password, 10);
        }
        await User.update(userData, { where: { id } });
        const updatedUser = await User.findByPk(id, { attributes: { exclude: ['password_hash'] } });
        res.json({ success: true, user: updatedUser });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.post('/api/categories', async (req, res) => {
    try {
        const { storeId, ...categoryData } = req.body;
        const category = await Category.create({
            ...categoryData,
            id: (0, uuid_1.v4)(),
            store_id: storeId
        });
        res.json({ success: true, category });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Category.destroy({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.post('/api/register', async (req, res) => {
    try {
        const { storeName, userName, email, password } = req.body;
        const verification = await EmailVerification.findOne({ where: { email } });
        if (!verification || !verification.getDataValue('verified')) {
            return res.status(400).json({ success: false, message: 'Email not verified. Please verify with OTP.' });
        }
        const storeId = (0, uuid_1.v4)();
        const userId = (0, uuid_1.v4)();
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        await sequelize.transaction(async (t) => {
            await Store.create({ id: storeId, name: storeName }, { transaction: t });
            await User.create({ id: userId, store_id: storeId, name: userName, email, password_hash: passwordHash, role: 'owner' }, { transaction: t });
            await Category.bulkCreate([
                { id: (0, uuid_1.v4)(), store_id: storeId, name: 'Gold Rings', metal_type: 'gold', description: 'Gold ring collection' },
                { id: (0, uuid_1.v4)(), store_id: storeId, name: 'Gold Necklaces', metal_type: 'gold', description: 'Gold necklace sets' },
                { id: (0, uuid_1.v4)(), store_id: storeId, name: 'Silver Items', metal_type: 'silver', description: 'Silver jewelry and articles' },
                { id: (0, uuid_1.v4)(), store_id: storeId, name: 'Diamond Jewelry', metal_type: 'gold', description: 'Diamond studded pieces' },
                { id: (0, uuid_1.v4)(), store_id: storeId, name: 'Bangles', metal_type: 'gold', description: 'Gold and diamond bangles' },
            ], { transaction: t });
        });
        const user = await User.findByPk(userId, { attributes: { exclude: ['password_hash'] } });
        res.json({ success: true, user });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email, is_active: true } });
        if (user && await bcryptjs_1.default.compare(password, user.getDataValue('password_hash'))) {
            const userJson = user.toJSON();
            delete userJson.password_hash;
            res.json({ success: true, user: userJson });
        }
        else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.post('/api/logout', (req, res) => {
    res.json({ success: true });
});
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const { storeId } = req.query;
        if (!storeId)
            return res.status(400).json({ success: false, message: 'storeId is required' });
        // Execute multiple queries in parallel for maximum speed
        const [totalSalesResult, activeRepairs, lowStock, customersCount, metalSalesRaw] = await Promise.all([
            Invoice.sum('total_amount', { where: { store_id: storeId } }),
            RepairOrder.count({
                where: {
                    store_id: storeId,
                    status: { [sequelize_1.Op.ne]: 'delivered' }
                }
            }),
            Product.count({
                where: {
                    store_id: storeId,
                    quantity: { [sequelize_1.Op.lte]: sequelize.col('min_stock_alert') }
                }
            }),
            Customer.count({ where: { store_id: storeId } }),
            InvoiceItem.findAll({
                attributes: ['metal_type', [sequelize.fn('SUM', sequelize.col('total_price')), 'total']],
                include: [{
                        model: Invoice,
                        as: 'invoice',
                        where: { store_id: storeId },
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
                store_id: storeId,
                invoice_date: { [sequelize_1.Op.gte]: sevenDaysAgo.toISOString().split('T')[0] }
            },
            group: ['invoice_date'],
            order: [['invoice_date', 'ASC']],
            raw: true
        });
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
        const metalColors = {
            gold: 'hsl(38, 92%, 50%)',
            silver: 'hsl(215, 20%, 65%)',
            platinum: 'hsl(217, 91%, 60%)',
            diamond: 'hsl(190, 91%, 60%)',
            other: 'hsl(0, 0%, 50%)'
        };
        const salesByMetal = metalSalesRaw.map(ms => ({
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
    }
    catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
app.get('/api/customers/lookup', async (req, res) => {
    try {
        const { storeId, phone } = req.query;
        const customer = await Customer.findOne({ where: { store_id: storeId, phone: phone } });
        res.json(customer || null);
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.post('/api/invoices', async (req, res) => {
    try {
        const { storeId, customer_id, customer_name, customer_phone, invoice_date, items, subtotal, discount, tax_amount, total_amount, payment_method, payment_status, notes } = req.body;
        const errors = [];
        const methodAllowed = ['cash', 'card', 'upi', 'bank'];
        const statusAllowed = ['paid', 'pending', 'due'];
        if (!storeId)
            errors.push('storeId required');
        if (!Array.isArray(items) || items.length === 0)
            errors.push('At least one item is required');
        if (payment_method && !methodAllowed.includes(String(payment_method).toLowerCase()))
            errors.push('Invalid payment method');
        if (payment_status && !statusAllowed.includes(String(payment_status).toLowerCase()))
            errors.push('Invalid payment status');
        const toFloat = (v) => Number(v || 0);
        const calcSubtotal = Array.isArray(items) ? items.reduce((s, it) => s + toFloat(it.unit_price) * toFloat(it.quantity), 0) : 0;
        const calcDiscount = Array.isArray(items) ? items.reduce((s, it) => s + (toFloat(it.unit_price) * toFloat(it.quantity) * (toFloat(it.discount_percent) / 100)), 0) : 0;
        const expectedTotal = calcSubtotal - calcDiscount + toFloat(tax_amount);
        const totalOk = Math.abs(expectedTotal - toFloat(total_amount)) < 0.01;
        if (!totalOk)
            errors.push('Total mismatch');
        for (const it of Array.isArray(items) ? items : []) {
            if (!(toFloat(it.quantity) >= 1)) {
                errors.push('Item quantity must be at least 1');
                break;
            }
            if (!(toFloat(it.unit_price) >= 0)) {
                errors.push('Item unit_price must be non-negative');
                break;
            }
        }
        if (errors.length)
            return res.status(400).json({ success: false, message: errors[0] });
        const nowMonth = new Date().toISOString().slice(0, 7);
        let quota = await StoreQuota.findOne({ where: { store_id: storeId } });
        if (!quota) {
            quota = await StoreQuota.create({ id: (0, uuid_1.v4)(), store_id: storeId, usage_month: nowMonth });
        }
        else if (quota.getDataValue('usage_month') !== nowMonth) {
            await quota.update({ usage_month: nowMonth, products_this_month: 0, invoices_this_month: 0 });
        }
        let planStatus = quota.getDataValue('plan_status');
        const planName = quota.getDataValue('plan_name');
        const premiumUntil = quota.getDataValue('premium_expires_at');
        const nowCheck = new Date();
        const isPremiumActive2 = planStatus === 'active' && planName === 'premium' && premiumUntil && new Date(premiumUntil) > nowCheck;
        const invoiceLimit = isPremiumActive2 ? 1000 : 200;
        const invoicesCount = quota.getDataValue('invoices_this_month');
        if (planStatus === 'locked')
            return res.status(402).json({ success: false, message: 'Upgrade required to generate invoices' });
        if (planStatus === 'trial') {
            if (quota.getDataValue('trial_remaining') <= 0) {
                return res.status(402).json({ success: false, message: 'Trial ended. Upgrade required to generate invoices' });
            }
        }
        else if (planStatus === 'active' && invoicesCount >= invoiceLimit) {
            return res.status(402).json({ success: false, message: `Invoice limit reached for this month (${invoiceLimit}). Upgrade cycle next month.` });
        }
        const invoiceId = (0, uuid_1.v4)();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `INV-${dateStr}-`;
        let finalInvoiceNumber = null;
        const latestSameDay = await Invoice.findOne({
            where: { store_id: storeId, invoice_number: { [sequelize_1.Op.like]: `${prefix}%` } },
            order: [['invoice_number', 'DESC']]
        });
        let seqNum = 1;
        if (latestSameDay) {
            const parts = String(latestSameDay.invoice_number).split('-');
            const lastSeq = parseInt(parts[parts.length - 1] || '0', 10);
            if (!isNaN(lastSeq))
                seqNum = lastSeq + 1;
        }
        await sequelize.transaction(async (t) => {
            let finalCustomerId = customer_id;
            if (!finalCustomerId && customer_phone) {
                const existingCustomer = await Customer.findOne({ where: { store_id: storeId, phone: customer_phone }, transaction: t });
                if (existingCustomer) {
                    finalCustomerId = existingCustomer.getDataValue('id');
                }
                else if (customer_name) {
                    finalCustomerId = (0, uuid_1.v4)();
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
                        subtotal, discount, tax_amount, total_amount, payment_method, payment_status, notes
                    }, { transaction: t });
                    finalInvoiceNumber = invoice_number;
                    created = true;
                }
                catch (e) {
                    const dup = e?.code === 'ER_DUP_ENTRY' ||
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
            for (const item of items) {
                await InvoiceItem.create({
                    id: (0, uuid_1.v4)(), invoice_id: invoiceId, product_id: item.product_id, product_name: item.product_name,
                    quantity: item.quantity, unit_price: item.unit_price, discount_percent: item.discount_percent || 0,
                    total_price: item.total_price, metal_type: item.metal_type, karat: item.karat, weight: item.weight
                }, { transaction: t });
                if (item.product_id) {
                    await Product.decrement('quantity', { by: item.quantity, where: { id: item.product_id }, transaction: t });
                }
            }
            if (finalCustomerId) {
                await Customer.increment('total_purchases', { by: total_amount, where: { id: finalCustomerId }, transaction: t });
            }
        });
        if (planStatus === 'trial' && quota.getDataValue('trial_remaining') > 0) {
            await quota.update({ trial_remaining: quota.getDataValue('trial_remaining') - 1 });
        }
        else {
            await quota.update({ invoices_this_month: invoicesCount + 1 });
        }
        res.json({ success: true, invoice_id: invoiceId, invoice_number: finalInvoiceNumber });
    }
    catch (error) {
        console.error('Invoice error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});
app.get('/api/invoices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findByPk(id, {
            include: [
                { model: InvoiceItem, as: 'items' },
                Customer
            ]
        });
        if (!invoice)
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.json(invoice);
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// Subscription status
app.get('/api/subscription/status', async (req, res) => {
    try {
        const { storeId } = req.query;
        let quota = await StoreQuota.findOne({ where: { store_id: storeId } });
        if (!quota) {
            quota = await StoreQuota.create({ id: (0, uuid_1.v4)(), store_id: storeId });
        }
        res.json({
            success: true,
            plan_status: quota.getDataValue('plan_status'),
            plan_name: quota.getDataValue('plan_name'),
            usage_month: quota.getDataValue('usage_month'),
            invoices_this_month: quota.getDataValue('invoices_this_month'),
            products_this_month: quota.getDataValue('products_this_month'),
            trial_remaining: quota.getDataValue('trial_remaining'),
            premium_expires_at: quota.getDataValue('premium_expires_at'),
            onboarding_offer_claimed: quota.getDataValue('onboarding_offer_claimed')
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.get('/api/subscription/offer-status', async (req, res) => {
    try {
        const { storeId } = req.query;
        if (!storeId)
            return res.status(400).json({ success: false, message: 'storeId required' });
        let quota = await StoreQuota.findOne({ where: { store_id: storeId } });
        if (!quota) {
            quota = await StoreQuota.create({ id: (0, uuid_1.v4)(), store_id: storeId });
        }
        const claimed = quota.getDataValue('onboarding_offer_claimed');
        const eligible = !claimed;
        res.json({ success: true, eligible, claimed });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.post('/api/subscription/claim-onboarding', async (req, res) => {
    try {
        const { storeId } = req.body;
        if (!storeId)
            return res.status(400).json({ success: false, message: 'storeId required' });
        let quota = await StoreQuota.findOne({ where: { store_id: storeId } });
        if (!quota) {
            quota = await StoreQuota.create({ id: (0, uuid_1.v4)(), store_id: storeId });
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
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.get('/api/subscription/qr', async (req, res) => {
    try {
        const storeId = req.query.storeId;
        if (!storeId)
            return res.status(400).send('storeId required');
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).send('Razorpay keys not configured');
        }
        let quota = await StoreQuota.findOne({ where: { store_id: storeId } });
        if (!quota) {
            quota = await StoreQuota.create({ id: (0, uuid_1.v4)(), store_id: storeId });
        }
        const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
        let shortUrl = null;
        const existingLinkId = quota.getDataValue('payment_link_id');
        if (existingLinkId) {
            const checkResp = await fetch(`https://api.razorpay.com/v1/payment_links/${existingLinkId}`, {
                headers: { 'Authorization': `Basic ${auth}` }
            });
            const checkData = await checkResp.json();
            if (checkResp.status >= 200 && checkResp.status < 300 && checkData.short_url) {
                if (['cancelled', 'expired'].includes(checkData.status)) {
                    shortUrl = null;
                }
                else {
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
            }
            else {
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
    }
    catch (error) {
        res.status(500).send(error.message);
    }
});
// Create Razorpay payment link for subscription
app.get('/api/subscription/upi', async (req, res) => {
    try {
        const storeId = req.query.storeId;
        if (!storeId)
            return res.status(400).send('storeId required');
        const store = await Store.findByPk(storeId);
        if (!store)
            return res.status(404).send('Store not found');
        const upiId = store.getDataValue('upi_id') || '';
        const storeName = store.getDataValue('name') || 'Merchant';
        if (!upiId)
            return res.status(400).send('Store UPI ID not configured');
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
    }
    catch (error) {
        res.status(500).send(error.message);
    }
});
// Create Razorpay payment link for subscription
app.post('/api/subscription/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret)
            return res.status(500).send('Webhook secret not configured');
        const signature = req.header('x-razorpay-signature') || '';
        const expected = crypto_1.default.createHmac('sha256', secret).update(req.body).digest('hex');
        if (signature !== expected)
            return res.status(400).send('Signature mismatch');
        const payload = JSON.parse(req.body.toString('utf8'));
        let linkId = null;
        let storeIdFromNotes = null;
        if (payload?.payload?.payment_link?.entity?.id) {
            linkId = payload.payload.payment_link.entity.id;
        }
        if (payload?.payload?.payment?.entity?.notes?.storeId) {
            storeIdFromNotes = payload.payload.payment.entity.notes.storeId;
        }
        let quota = null;
        if (linkId) {
            quota = await StoreQuota.findOne({ where: { payment_link_id: linkId } });
        }
        else if (storeIdFromNotes) {
            quota = await StoreQuota.findOne({ where: { store_id: storeIdFromNotes } });
        }
        if (!quota)
            return res.status(200).send('ok');
        const paidAmount = Number(payload?.payload?.payment?.entity?.amount) || 0;
        const currency = payload?.payload?.payment?.entity?.currency || '';
        const status = payload?.payload?.payment?.entity?.status || '';
        if ((status === 'captured' || status === 'authorized') && paidAmount === SUBSCRIPTION_AMOUNT_PAISE && currency === 'INR') {
            await quota.update({ plan_status: 'active', plan_started_at: new Date(), plan_name: 'base' });
        }
        res.status(200).send('ok');
    }
    catch (error) {
        res.status(500).send(error.message);
    }
});
// Create Razorpay payment link for subscription
app.post('/api/subscription/payment-link', async (req, res) => {
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
            let quota = await StoreQuota.findOne({ where: { store_id: storeId } });
            if (!quota) {
                quota = await StoreQuota.create({ id: (0, uuid_1.v4)(), store_id: storeId });
            }
            await quota.update({ payment_link_id: data.id });
            res.json({ success: true, short_url: data.short_url });
        }
        else {
            res.status(400).json({ success: false, message: data.error?.description || 'Failed to create payment link' });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
const verifySubscription = async (req, res) => {
    try {
        const storeId = (req.body.storeId || req.query.storeId);
        const incomingLinkId = (req.query.razorpay_payment_link_id || req.body.payment_link_id);
        const callbackStatus = (req.query.razorpay_payment_link_status || req.body.razorpay_payment_link_status);
        let quota = null;
        let linkId = null;
        if (storeId) {
            quota = await StoreQuota.findOne({ where: { store_id: storeId } });
            if (!quota)
                return res.status(400).json({ success: false, message: 'No quota record found' });
            linkId = quota.getDataValue('payment_link_id') || null;
        }
        else if (incomingLinkId) {
            quota = await StoreQuota.findOne({ where: { payment_link_id: incomingLinkId } });
            if (!quota)
                return res.status(400).json({ success: false, message: 'No quota record found for payment link' });
            linkId = incomingLinkId;
        }
        else {
            return res.status(400).json({ success: false, message: 'storeId or razorpay_payment_link_id required' });
        }
        if (!linkId)
            return res.status(400).json({ success: false, message: 'No payment link found. Create a new one.' });
        if (!quota)
            return res.status(400).json({ success: false, message: 'No quota record found' });
        const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
        const plResp = await fetch(`https://api.razorpay.com/v1/payment_links/${linkId}`, {
            headers: { 'Authorization': `Basic ${auth}` }
        });
        const plData = await plResp.json();
        if (!(plResp.status >= 200 && plResp.status < 300)) {
            return res.status(400).json({ success: false, message: plData.error?.description || 'Failed to verify payment link' });
        }
        const payments = Array.isArray(plData.payments) ? plData.payments : [];
        const hasCapturedPayment = payments.some((p) => p && p.status === 'captured');
        const status = plData.status;
        const isCompleted = status === 'completed' || status === 'paid' || callbackStatus === 'paid';
        const correctAmount = Number(plData.amount) === SUBSCRIPTION_AMOUNT_PAISE && plData.currency === 'INR';
        if (isCompleted || hasCapturedPayment) {
            if (!correctAmount) {
                return res.status(400).json({ success: false, message: 'Amount mismatch for base plan' });
            }
            await quota.update({ plan_status: 'active', plan_started_at: new Date(), plan_name: 'base' });
            return res.json({ success: true });
        }
        return res.status(402).json({ success: false, message: `Payment not completed. Link status: ${status}` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
app.post('/api/subscription/verify', verifySubscription);
app.get('/api/subscription/verify', verifySubscription);
// --- SERVER STARTUP ---
app.put('/api/invoices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        await Invoice.update(updateData, { where: { id } });
        const updatedInvoice = await Invoice.findByPk(id, { include: [{ model: InvoiceItem, as: 'items' }, Customer] });
        res.json(updatedInvoice);
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to TiDB Cloud (MySQL).');
        await sequelize.sync();
        const qi = sequelize.getQueryInterface();
        const tableName = StoreQuota.getTableName();
        const schema = await qi.describeTable(tableName);
        if (!('payment_link_id' in schema)) {
            await qi.addColumn(tableName, 'payment_link_id', {
                type: sequelize_1.DataTypes.STRING(64),
                allowNull: true
            });
        }
        if (!('onboarding_offer_claimed' in schema)) {
            await qi.addColumn(tableName, 'onboarding_offer_claimed', {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            });
        }
        if (!('premium_expires_at' in schema)) {
            await qi.addColumn(tableName, 'premium_expires_at', {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            });
        }
        console.log('Models synced with database.');
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};
startServer();
