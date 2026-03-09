// Dummy data for JewelTrack

export interface Store {
  id: string;
  name: string;
  address: string;
  gst_number: string;
  phone: string;
  logo_url: string;
  currency: string;
  tax_rate: number;
}

export interface User {
  id: string;
  store_id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'salesperson' | 'viewer';
  avatar_url: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  metal_type: 'gold' | 'silver' | 'platinum' | 'other';
  description: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  sku: string;
  barcode: string;
  metal_type: 'gold' | 'silver' | 'platinum' | 'other';
  karat: string;
  gross_weight: number;
  net_weight: number;
  stone_type: string;
  stone_weight: number;
  making_charges: number;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  min_stock_alert: number;
  images: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  anniversary_date: string;
  birthday: string;
  total_purchases: number;
  loyalty_points: number;
  notes: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  store_id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  subtotal: number;
  discount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'cheque';
  payment_status: 'paid' | 'partial' | 'unpaid';
  notes: string;
  created_at: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total_price: number;
  metal_type: string;
  karat: string;
  weight: number;
}

export interface RepairOrder {
  id: string;
  store_id: string;
  customer_id: string;
  order_number: string;
  item_description: string;
  issue_description: string;
  photos: string[];
  assigned_to: string;
  estimated_date: string;
  advance_amount: number;
  total_estimate: number;
  status: 'received' | 'in_progress' | 'ready' | 'delivered';
  created_at: string;
  updated_at: string;
}

export const store: Store = {
  id: 's1',
  name: 'Mehta Jewellers',
  address: '42 Zaveri Bazaar, Mumbai, Maharashtra 400002',
  gst_number: '27AABCM1234A1Z5',
  phone: '+91 98765 43210',
  logo_url: '',
  currency: 'INR',
  tax_rate: 3,
};

export const users: User[] = [
  { id: 'u1', store_id: 's1', name: 'Rajesh Mehta', email: 'rajesh@mehtajewellers.com', role: 'owner', avatar_url: '', is_active: true },
  { id: 'u2', store_id: 's1', name: 'Priya Sharma', email: 'priya@mehtajewellers.com', role: 'manager', avatar_url: '', is_active: true },
  { id: 'u3', store_id: 's1', name: 'Amit Patel', email: 'amit@mehtajewellers.com', role: 'salesperson', avatar_url: '', is_active: true },
];

export const categories: Category[] = [
  { id: 'c1', store_id: 's1', name: 'Gold Rings', metal_type: 'gold', description: 'Gold ring collection' },
  { id: 'c2', store_id: 's1', name: 'Gold Necklaces', metal_type: 'gold', description: 'Gold necklace sets' },
  { id: 'c3', store_id: 's1', name: 'Silver Items', metal_type: 'silver', description: 'Silver jewelry and articles' },
  { id: 'c4', store_id: 's1', name: 'Diamond Jewelry', metal_type: 'gold', description: 'Diamond studded pieces' },
  { id: 'c5', store_id: 's1', name: 'Bangles', metal_type: 'gold', description: 'Gold and diamond bangles' },
];

export const products: Product[] = [
  { id: 'p1', store_id: 's1', category_id: 'c1', name: 'Royal Solitaire Ring', sku: 'GR-001', barcode: '8901234567890', metal_type: 'gold', karat: '22k', gross_weight: 8.5, net_weight: 7.2, stone_type: 'Diamond', stone_weight: 0.5, making_charges: 3500, purchase_price: 42000, selling_price: 58500, quantity: 3, min_stock_alert: 2, images: [], status: 'active', created_at: '2024-01-15', updated_at: '2024-02-01' },
  { id: 'p2', store_id: 's1', category_id: 'c1', name: 'Classic Band Ring', sku: 'GR-002', barcode: '8901234567891', metal_type: 'gold', karat: '18k', gross_weight: 5.0, net_weight: 5.0, stone_type: 'None', stone_weight: 0, making_charges: 2000, purchase_price: 25000, selling_price: 32000, quantity: 8, min_stock_alert: 3, images: [], status: 'active', created_at: '2024-01-18', updated_at: '2024-01-18' },
  { id: 'p3', store_id: 's1', category_id: 'c2', name: 'Temple Necklace Set', sku: 'GN-001', barcode: '8901234567892', metal_type: 'gold', karat: '22k', gross_weight: 45.0, net_weight: 42.5, stone_type: 'Ruby', stone_weight: 2.0, making_charges: 15000, purchase_price: 285000, selling_price: 345000, quantity: 1, min_stock_alert: 1, images: [], status: 'active', created_at: '2024-01-20', updated_at: '2024-01-20' },
  { id: 'p4', store_id: 's1', category_id: 'c2', name: 'Lakshmi Haar', sku: 'GN-002', barcode: '8901234567893', metal_type: 'gold', karat: '22k', gross_weight: 65.0, net_weight: 62.0, stone_type: 'None', stone_weight: 0, making_charges: 22000, purchase_price: 420000, selling_price: 498000, quantity: 1, min_stock_alert: 1, images: [], status: 'active', created_at: '2024-02-01', updated_at: '2024-02-01' },
  { id: 'p5', store_id: 's1', category_id: 'c3', name: 'Silver Anklet Pair', sku: 'SI-001', barcode: '8901234567894', metal_type: 'silver', karat: '925', gross_weight: 50.0, net_weight: 50.0, stone_type: 'None', stone_weight: 0, making_charges: 800, purchase_price: 4500, selling_price: 6200, quantity: 12, min_stock_alert: 5, images: [], status: 'active', created_at: '2024-01-10', updated_at: '2024-01-10' },
  { id: 'p6', store_id: 's1', category_id: 'c3', name: 'Silver Pooja Thali', sku: 'SI-002', barcode: '8901234567895', metal_type: 'silver', karat: '925', gross_weight: 250.0, net_weight: 250.0, stone_type: 'None', stone_weight: 0, making_charges: 2500, purchase_price: 18000, selling_price: 24500, quantity: 4, min_stock_alert: 2, images: [], status: 'active', created_at: '2024-01-12', updated_at: '2024-01-12' },
  { id: 'p7', store_id: 's1', category_id: 'c4', name: 'Diamond Stud Earrings', sku: 'DJ-001', barcode: '8901234567896', metal_type: 'gold', karat: '18k', gross_weight: 4.0, net_weight: 2.8, stone_type: 'Diamond', stone_weight: 1.2, making_charges: 8000, purchase_price: 85000, selling_price: 112000, quantity: 2, min_stock_alert: 1, images: [], status: 'active', created_at: '2024-02-05', updated_at: '2024-02-05' },
  { id: 'p8', store_id: 's1', category_id: 'c4', name: 'Diamond Tennis Bracelet', sku: 'DJ-002', barcode: '8901234567897', metal_type: 'gold', karat: '18k', gross_weight: 15.0, net_weight: 10.0, stone_type: 'Diamond', stone_weight: 5.0, making_charges: 25000, purchase_price: 350000, selling_price: 425000, quantity: 1, min_stock_alert: 1, images: [], status: 'active', created_at: '2024-02-10', updated_at: '2024-02-10' },
  { id: 'p9', store_id: 's1', category_id: 'c5', name: 'Traditional Gold Bangle Set', sku: 'BG-001', barcode: '8901234567898', metal_type: 'gold', karat: '22k', gross_weight: 32.0, net_weight: 32.0, stone_type: 'None', stone_weight: 0, making_charges: 9600, purchase_price: 210000, selling_price: 256000, quantity: 2, min_stock_alert: 1, images: [], status: 'active', created_at: '2024-01-25', updated_at: '2024-01-25' },
  { id: 'p10', store_id: 's1', category_id: 'c5', name: 'Diamond Studded Bangle', sku: 'BG-002', barcode: '8901234567899', metal_type: 'gold', karat: '18k', gross_weight: 18.0, net_weight: 15.0, stone_type: 'Diamond', stone_weight: 3.0, making_charges: 12000, purchase_price: 180000, selling_price: 225000, quantity: 1, min_stock_alert: 1, images: [], status: 'active', created_at: '2024-02-08', updated_at: '2024-02-08' },
  { id: 'p11', store_id: 's1', category_id: 'c1', name: 'Engagement Diamond Ring', sku: 'GR-003', barcode: '8901234567900', metal_type: 'gold', karat: '18k', gross_weight: 6.0, net_weight: 4.5, stone_type: 'Diamond', stone_weight: 1.5, making_charges: 5500, purchase_price: 95000, selling_price: 128000, quantity: 4, min_stock_alert: 2, images: [], status: 'active', created_at: '2024-02-12', updated_at: '2024-02-12' },
  { id: 'p12', store_id: 's1', category_id: 'c1', name: 'Mens Signet Ring', sku: 'GR-004', barcode: '8901234567901', metal_type: 'gold', karat: '22k', gross_weight: 12.0, net_weight: 12.0, stone_type: 'None', stone_weight: 0, making_charges: 4000, purchase_price: 78000, selling_price: 95000, quantity: 5, min_stock_alert: 2, images: [], status: 'active', created_at: '2024-01-22', updated_at: '2024-01-22' },
  { id: 'p13', store_id: 's1', category_id: 'c2', name: 'Choker Necklace', sku: 'GN-003', barcode: '8901234567902', metal_type: 'gold', karat: '22k', gross_weight: 28.0, net_weight: 26.0, stone_type: 'Emerald', stone_weight: 1.5, making_charges: 10000, purchase_price: 185000, selling_price: 228000, quantity: 2, min_stock_alert: 1, images: [], status: 'active', created_at: '2024-02-03', updated_at: '2024-02-03' },
  { id: 'p14', store_id: 's1', category_id: 'c3', name: 'Silver Bracelet Chain', sku: 'SI-003', barcode: '8901234567903', metal_type: 'silver', karat: '925', gross_weight: 25.0, net_weight: 25.0, stone_type: 'None', stone_weight: 0, making_charges: 500, purchase_price: 2200, selling_price: 3500, quantity: 15, min_stock_alert: 5, images: [], status: 'active', created_at: '2024-01-08', updated_at: '2024-01-08' },
  { id: 'p15', store_id: 's1', category_id: 'c4', name: 'Diamond Pendant', sku: 'DJ-003', barcode: '8901234567904', metal_type: 'gold', karat: '18k', gross_weight: 5.5, net_weight: 3.5, stone_type: 'Diamond', stone_weight: 2.0, making_charges: 6000, purchase_price: 125000, selling_price: 158000, quantity: 3, min_stock_alert: 1, images: [], status: 'active', created_at: '2024-02-14', updated_at: '2024-02-14' },
  { id: 'p16', store_id: 's1', category_id: 'c2', name: 'Mangalsutra Chain', sku: 'GN-004', barcode: '8901234567905', metal_type: 'gold', karat: '22k', gross_weight: 12.0, net_weight: 11.0, stone_type: 'None', stone_weight: 0, making_charges: 4200, purchase_price: 72000, selling_price: 89000, quantity: 6, min_stock_alert: 3, images: [], status: 'active', created_at: '2024-01-30', updated_at: '2024-01-30' },
  { id: 'p17', store_id: 's1', category_id: 'c5', name: 'Kids Gold Bangle', sku: 'BG-003', barcode: '8901234567906', metal_type: 'gold', karat: '22k', gross_weight: 8.0, net_weight: 8.0, stone_type: 'None', stone_weight: 0, making_charges: 2400, purchase_price: 52000, selling_price: 64000, quantity: 0, min_stock_alert: 2, images: [], status: 'active', created_at: '2024-02-06', updated_at: '2024-02-06' },
  { id: 'p18', store_id: 's1', category_id: 'c3', name: 'Silver Nose Ring Set', sku: 'SI-004', barcode: '8901234567907', metal_type: 'silver', karat: '925', gross_weight: 3.0, net_weight: 3.0, stone_type: 'None', stone_weight: 0, making_charges: 200, purchase_price: 350, selling_price: 750, quantity: 20, min_stock_alert: 8, images: [], status: 'active', created_at: '2024-01-05', updated_at: '2024-01-05' },
  { id: 'p19', store_id: 's1', category_id: 'c1', name: 'Cocktail Ruby Ring', sku: 'GR-005', barcode: '8901234567908', metal_type: 'gold', karat: '18k', gross_weight: 7.0, net_weight: 5.5, stone_type: 'Ruby', stone_weight: 1.5, making_charges: 4500, purchase_price: 68000, selling_price: 85000, quantity: 2, min_stock_alert: 1, images: [], status: 'active', created_at: '2024-02-15', updated_at: '2024-02-15' },
  { id: 'p20', store_id: 's1', category_id: 'c4', name: 'Diamond Nose Pin', sku: 'DJ-004', barcode: '8901234567909', metal_type: 'gold', karat: '18k', gross_weight: 1.5, net_weight: 1.0, stone_type: 'Diamond', stone_weight: 0.3, making_charges: 1500, purchase_price: 18000, selling_price: 24500, quantity: 7, min_stock_alert: 3, images: [], status: 'active', created_at: '2024-02-11', updated_at: '2024-02-11' },
];

export const customers: Customer[] = [
  { id: 'cu1', store_id: 's1', name: 'Anita Desai', phone: '+91 98765 11111', email: 'anita@gmail.com', address: 'Andheri West, Mumbai', anniversary_date: '2015-02-14', birthday: '1988-06-15', total_purchases: 585000, loyalty_points: 5850, notes: 'Prefers 22k gold. Regular customer.', created_at: '2023-06-10' },
  { id: 'cu2', store_id: 's1', name: 'Vikram Singh', phone: '+91 98765 22222', email: 'vikram@gmail.com', address: 'Bandra East, Mumbai', anniversary_date: '2020-11-20', birthday: '1985-03-22', total_purchases: 345000, loyalty_points: 3450, notes: 'Purchased engagement ring.', created_at: '2023-08-15' },
  { id: 'cu3', store_id: 's1', name: 'Sunita Agarwal', phone: '+91 98765 33333', email: 'sunita@gmail.com', address: 'Dadar, Mumbai', anniversary_date: '2010-05-05', birthday: '1975-12-01', total_purchases: 892000, loyalty_points: 8920, notes: 'VIP customer. Prefers diamond jewelry.', created_at: '2023-01-20' },
  { id: 'cu4', store_id: 's1', name: 'Rohit Joshi', phone: '+91 98765 44444', email: 'rohit@gmail.com', address: 'Juhu, Mumbai', anniversary_date: '', birthday: '1990-08-18', total_purchases: 128000, loyalty_points: 1280, notes: '', created_at: '2023-11-05' },
  { id: 'cu5', store_id: 's1', name: 'Kavita Reddy', phone: '+91 98765 55555', email: 'kavita@gmail.com', address: 'Powai, Mumbai', anniversary_date: '2018-12-12', birthday: '1992-04-30', total_purchases: 456000, loyalty_points: 4560, notes: 'Interested in antique designs.', created_at: '2023-04-12' },
  { id: 'cu6', store_id: 's1', name: 'Manoj Gupta', phone: '+91 98765 66666', email: 'manoj@gmail.com', address: 'Thane, Mumbai', anniversary_date: '2008-01-26', birthday: '1980-09-14', total_purchases: 215000, loyalty_points: 2150, notes: 'Bulk buyer for festivals.', created_at: '2023-07-22' },
  { id: 'cu7', store_id: 's1', name: 'Deepa Nair', phone: '+91 98765 77777', email: 'deepa@gmail.com', address: 'Vile Parle, Mumbai', anniversary_date: '2019-06-08', birthday: '1995-11-25', total_purchases: 78000, loyalty_points: 780, notes: '', created_at: '2024-01-10' },
  { id: 'cu8', store_id: 's1', name: 'Arjun Kapoor', phone: '+91 98765 88888', email: 'arjun@gmail.com', address: 'Colaba, Mumbai', anniversary_date: '', birthday: '1982-07-05', total_purchases: 1250000, loyalty_points: 12500, notes: 'High-value customer. Diamond collector.', created_at: '2022-12-01' },
  { id: 'cu9', store_id: 's1', name: 'Meera Iyer', phone: '+91 98765 99999', email: 'meera@gmail.com', address: 'Malad, Mumbai', anniversary_date: '2016-03-15', birthday: '1987-02-28', total_purchases: 320000, loyalty_points: 3200, notes: 'Prefers south Indian designs.', created_at: '2023-05-18' },
  { id: 'cu10', store_id: 's1', name: 'Suresh Patel', phone: '+91 98765 00000', email: 'suresh@gmail.com', address: 'Borivali, Mumbai', anniversary_date: '2012-10-10', birthday: '1978-01-12', total_purchases: 567000, loyalty_points: 5670, notes: 'Regular silver buyer.', created_at: '2023-03-08' },
];

export const invoices: Invoice[] = [
  { id: 'inv1', store_id: 's1', customer_id: 'cu1', invoice_number: 'INV-2024-0001', invoice_date: '2024-02-15', subtotal: 58500, discount: 2000, tax_amount: 1695, total_amount: 58195, payment_method: 'card', payment_status: 'paid', notes: '', created_at: '2024-02-15', items: [{ id: 'ii1', invoice_id: 'inv1', product_id: 'p1', product_name: 'Royal Solitaire Ring', quantity: 1, unit_price: 58500, discount_percent: 3.4, total_price: 56500, metal_type: 'gold', karat: '22k', weight: 7.2 }] },
  { id: 'inv2', store_id: 's1', customer_id: 'cu3', invoice_number: 'INV-2024-0002', invoice_date: '2024-02-16', subtotal: 345000, discount: 10000, tax_amount: 10050, total_amount: 345050, payment_method: 'upi', payment_status: 'paid', notes: 'Special occasion discount', created_at: '2024-02-16', items: [{ id: 'ii2', invoice_id: 'inv2', product_id: 'p3', product_name: 'Temple Necklace Set', quantity: 1, unit_price: 345000, discount_percent: 2.9, total_price: 335000, metal_type: 'gold', karat: '22k', weight: 42.5 }] },
  { id: 'inv3', store_id: 's1', customer_id: 'cu2', invoice_number: 'INV-2024-0003', invoice_date: '2024-02-17', subtotal: 128000, discount: 0, tax_amount: 3840, total_amount: 131840, payment_method: 'cash', payment_status: 'paid', notes: '', created_at: '2024-02-17', items: [{ id: 'ii3', invoice_id: 'inv3', product_id: 'p11', product_name: 'Engagement Diamond Ring', quantity: 1, unit_price: 128000, discount_percent: 0, total_price: 128000, metal_type: 'gold', karat: '18k', weight: 4.5 }] },
  { id: 'inv4', store_id: 's1', customer_id: 'cu5', invoice_number: 'INV-2024-0004', invoice_date: '2024-02-18', subtotal: 256000, discount: 5000, tax_amount: 7530, total_amount: 258530, payment_method: 'card', payment_status: 'partial', notes: 'Balance: ₹50,000 due next week', created_at: '2024-02-18', items: [{ id: 'ii4', invoice_id: 'inv4', product_id: 'p9', product_name: 'Traditional Gold Bangle Set', quantity: 1, unit_price: 256000, discount_percent: 2, total_price: 251000, metal_type: 'gold', karat: '22k', weight: 32.0 }] },
  { id: 'inv5', store_id: 's1', customer_id: 'cu8', invoice_number: 'INV-2024-0005', invoice_date: '2024-02-19', subtotal: 425000, discount: 15000, tax_amount: 12300, total_amount: 422300, payment_method: 'cheque', payment_status: 'unpaid', notes: 'Cheque not yet cleared', created_at: '2024-02-19', items: [{ id: 'ii5', invoice_id: 'inv5', product_id: 'p8', product_name: 'Diamond Tennis Bracelet', quantity: 1, unit_price: 425000, discount_percent: 3.5, total_price: 410000, metal_type: 'gold', karat: '18k', weight: 10.0 }] },
  { id: 'inv6', store_id: 's1', customer_id: 'cu6', invoice_number: 'INV-2024-0006', invoice_date: '2024-02-20', subtotal: 24500, discount: 0, tax_amount: 735, total_amount: 25235, payment_method: 'cash', payment_status: 'paid', notes: '', created_at: '2024-02-20', items: [{ id: 'ii6', invoice_id: 'inv6', product_id: 'p6', product_name: 'Silver Pooja Thali', quantity: 1, unit_price: 24500, discount_percent: 0, total_price: 24500, metal_type: 'silver', karat: '925', weight: 250.0 }] },
  { id: 'inv7', store_id: 's1', customer_id: 'cu9', invoice_number: 'INV-2024-0007', invoice_date: '2024-02-21', subtotal: 89000, discount: 2000, tax_amount: 2610, total_amount: 89610, payment_method: 'upi', payment_status: 'paid', notes: '', created_at: '2024-02-21', items: [{ id: 'ii7', invoice_id: 'inv7', product_id: 'p16', product_name: 'Mangalsutra Chain', quantity: 1, unit_price: 89000, discount_percent: 2.2, total_price: 87000, metal_type: 'gold', karat: '22k', weight: 11.0 }] },
  { id: 'inv8', store_id: 's1', customer_id: 'cu4', invoice_number: 'INV-2024-0008', invoice_date: '2024-02-22', subtotal: 85000, discount: 3000, tax_amount: 2460, total_amount: 84460, payment_method: 'card', payment_status: 'paid', notes: 'Birthday gift', created_at: '2024-02-22', items: [{ id: 'ii8', invoice_id: 'inv8', product_id: 'p19', product_name: 'Cocktail Ruby Ring', quantity: 1, unit_price: 85000, discount_percent: 3.5, total_price: 82000, metal_type: 'gold', karat: '18k', weight: 5.5 }] },
];

export const repairOrders: RepairOrder[] = [
  { id: 'r1', store_id: 's1', customer_id: 'cu1', order_number: 'REP-2024-001', item_description: 'Gold chain 22k, 18g', issue_description: 'Broken clasp, needs replacement', photos: [], assigned_to: 'u3', estimated_date: '2024-02-25', advance_amount: 500, total_estimate: 2500, status: 'received', created_at: '2024-02-18', updated_at: '2024-02-18' },
  { id: 'r2', store_id: 's1', customer_id: 'cu3', order_number: 'REP-2024-002', item_description: 'Diamond ring 18k', issue_description: 'Stone tightening and polishing', photos: [], assigned_to: 'u3', estimated_date: '2024-02-22', advance_amount: 1000, total_estimate: 3500, status: 'in_progress', created_at: '2024-02-15', updated_at: '2024-02-19' },
  { id: 'r3', store_id: 's1', customer_id: 'cu5', order_number: 'REP-2024-003', item_description: 'Gold bangles set 22k', issue_description: 'Resizing - needs to be made smaller', photos: [], assigned_to: 'u3', estimated_date: '2024-02-20', advance_amount: 800, total_estimate: 4000, status: 'ready', created_at: '2024-02-12', updated_at: '2024-02-20' },
  { id: 'r4', store_id: 's1', customer_id: 'cu8', order_number: 'REP-2024-004', item_description: 'Platinum ring with sapphire', issue_description: 'Rhodium plating renewal', photos: [], assigned_to: 'u3', estimated_date: '2024-02-28', advance_amount: 2000, total_estimate: 5000, status: 'in_progress', created_at: '2024-02-20', updated_at: '2024-02-21' },
  { id: 'r5', store_id: 's1', customer_id: 'cu10', order_number: 'REP-2024-005', item_description: 'Silver antique necklace', issue_description: 'Cleaning and re-oxidizing', photos: [], assigned_to: 'u3', estimated_date: '2024-02-19', advance_amount: 300, total_estimate: 1500, status: 'delivered', created_at: '2024-02-10', updated_at: '2024-02-19' },
];

// Helper functions
export const getCustomerName = (customerId: string): string => {
  return customers.find(c => c.id === customerId)?.name ?? 'Unknown';
};

export const getCategoryName = (categoryId: string): string => {
  return categories.find(c => c.id === categoryId)?.name ?? 'Unknown';
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const salesLast7Days = [
  { day: 'Mon', amount: 58195 },
  { day: 'Tue', amount: 345050 },
  { day: 'Wed', amount: 131840 },
  { day: 'Thu', amount: 258530 },
  { day: 'Fri', amount: 422300 },
  { day: 'Sat', amount: 25235 },
  { day: 'Sun', amount: 89610 },
];

export const salesByMetal = [
  { name: 'Gold', value: 1048085, fill: 'hsl(38, 92%, 50%)' },
  { name: 'Silver', value: 25235, fill: 'hsl(215, 20%, 65%)' },
  { name: 'Diamond', value: 422300, fill: 'hsl(217, 91%, 60%)' },
];
