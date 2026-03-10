import { useQuery } from '@tanstack/react-query';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').trim().replace(/\/$/, '');
const API_BASE_URL = `${VITE_API_URL}/api`;

const getStoreId = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  const user = JSON.parse(userStr);
  return user.store_id;
};

export const fetchStore = async () => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/store?storeId=${storeId}`);
  if (!response.ok) throw new Error('Failed to fetch store');
  return response.json();
};

export const fetchUsers = async () => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/users?storeId=${storeId}`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

export const fetchCategories = async () => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/categories?storeId=${storeId}`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
};

export const fetchProducts = async () => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/products?storeId=${storeId}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
};

export const fetchCustomers = async () => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/customers?storeId=${storeId}`);
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
};

export const fetchInvoices = async () => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/invoices?storeId=${storeId}`);
  if (!response.ok) throw new Error('Failed to fetch invoices');
  return response.json();
};

export const fetchInvoiceById = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/invoices/${id}`);
  if (!response.ok) throw new Error('Failed to fetch invoice');
  return response.json();
};

export const createInvoice = async (invoiceData: any) => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...invoiceData, storeId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create invoice');
  }
  return response.json();
};

export const lookupCustomerByPhone = async (phone: string) => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/customers/lookup?storeId=${storeId}&phone=${phone}`);
  if (!response.ok) return null;
  return response.json();
};

export const fetchRepairs = async () => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/repairs?storeId=${storeId}`);
  if (!response.ok) throw new Error('Failed to fetch repairs');
  return response.json();
};

export const fetchDashboardStats = async () => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/dashboard/stats?storeId=${storeId}`);
  if (!response.ok) throw new Error('Failed to fetch dashboard stats');
  return response.json();
};

export const fetchMetalRates = async () => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/metal-rates?storeId=${storeId}`);
  if (!response.ok) throw new Error('Failed to fetch metal rates');
  return response.json();
};

export const updateMetalRates = async (rates: any) => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/metal-rates`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...rates, storeId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update metal rates');
  }
  return response.json();
};

export const fetchNotifications = async () => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/notifications?storeId=${storeId}`);
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
};

export const createNotification = async (notificationData: any) => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...notificationData, storeId }),
  });
  if (!response.ok) throw new Error('Failed to create notification');
  return response.json();
};

export const markNotificationAsRead = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'PUT',
  });
  if (!response.ok) throw new Error('Failed to mark notification as read');
  return response.json();
};

export const acknowledgeNotification = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/acknowledge`, {
    method: 'PUT',
  });
  if (!response.ok) throw new Error('Failed to acknowledge notification');
  return response.json();
};

export const markAllNotificationsAsRead = async () => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeId }),
  });
  if (!response.ok) throw new Error('Failed to mark all notifications as read');
  return response.json();
};

export const deleteNotification = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete notification');
  return response.json();
};

export const createProduct = async (productData: any) => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...productData, storeId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create product');
  }
  return response.json();
};

export const updateProduct = async (id: string, productData: any) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update product');
  }
  return response.json();
};

export const deleteProduct = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete product');
  }
  return response.json();
};

export const updateStore = async (id: string, storeData: any) => {
  const response = await fetch(`${API_BASE_URL}/store/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(storeData),
  });
  if (!response.ok) throw new Error('Failed to update store');
  return response.json();
};

export const updateUser = async (id: string, userData: any) => {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error('Failed to update user');
  return response.json();
};

export const createUser = async (userData: any) => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...userData, storeId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create user');
  }
  return response.json();
};

export const createCategory = async (categoryData: any) => {
  const storeId = getStoreId();
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...categoryData, storeId }),
  });
  if (!response.ok) throw new Error('Failed to create category');
  return response.json();
};

export const deleteCategory = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete category');
  return response.json();
};

// React Query Hooks
export const useStore = () => useQuery({ queryKey: ['store'], queryFn: fetchStore });
export const useUsers = () => useQuery({ queryKey: ['users'], queryFn: fetchUsers });
export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
export const useProducts = () => useQuery({ queryKey: ['products'], queryFn: fetchProducts });
export const useCustomers = () => useQuery({ queryKey: ['customers'], queryFn: fetchCustomers });
export const useInvoices = () => useQuery({ queryKey: ['invoices'], queryFn: fetchInvoices });
export const useRepairs = () => useQuery({ queryKey: ['repairs'], queryFn: fetchRepairs });
export const useDashboardStats = () => useQuery({ queryKey: ['dashboard-stats'], queryFn: fetchDashboardStats });
export const useNotifications = () => useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications });
export const useMetalRates = () => useQuery({ queryKey: ['metal-rates'], queryFn: fetchMetalRates });

// Helper functions for use with fetched data
export const getCustomerName = (customers: any[], customerId: string): string => {
  return customers.find(c => c.id === customerId)?.name ?? 'Unknown';
};

export const getCategoryName = (categories: any[], categoryId: string): string => {
  return categories.find(c => c.id === categoryId)?.name ?? 'Unknown';
};

export const calculateProductPrice = (p: any, rates: any) => {
  if (p.selling_price > 0) return p.selling_price;
  
  const karatStr = String(p.karat || '').toLowerCase();
  const karatNum = parseInt(karatStr.replace(/[^0-9]/g, '')) || 0;
  let perGm = 0;
  if (p.metal_type === 'gold') {
    if (karatNum >= 24) perGm = Number(rates?.gold_24k_per_gm) || 0;
    else if (karatNum >= 22) perGm = Number(rates?.gold_22k_per_gm) || 0;
    else if (karatNum >= 18) perGm = Number(rates?.gold_18k_per_gm) || 0;
  } else if (p.metal_type === 'silver') {
    perGm = Number(rates?.silver_per_gm) || 0;
  } else if (p.metal_type === 'platinum') {
    perGm = Number(rates?.platinum_per_gm) || 0;
  }
  const baseCalc = (Number(p.net_weight) || 0) * perGm + (Number(p.making_charges) || 0);
  return Math.max(0, Math.round(baseCalc * 100) / 100);
};
