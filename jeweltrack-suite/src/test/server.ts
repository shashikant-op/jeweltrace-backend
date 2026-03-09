import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('http://localhost:3001/api/login', async ({ request }) => {
    const { email } = (await request.json()) as { email: string };
    if (email === 'rajesh@mehtajewellers.com') {
      return HttpResponse.json({
        success: true,
        user: {
          id: 'u1',
          name: 'Rajesh Mehta',
          email: 'rajesh@mehtajewellers.com',
          role: 'owner'
        }
      });
    }
    return HttpResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  }),

  http.get('http://localhost:3001/api/dashboard/stats', () => {
    return HttpResponse.json({
      totalSales: 1500000,
      activeRepairs: 42,
      lowStock: 7,
      customersCount: 88,
      salesLast7Days: [
        { day: 'Mon', amount: 10000 },
        { day: 'Tue', amount: 20000 }
      ],
      salesByMetal: [
        { name: 'Gold', value: 1000000, fill: '#FFD700' }
      ]
    });
  }),

  http.get('http://localhost:3001/api/invoices', () => {
    return HttpResponse.json([
      {
        id: 'inv1',
        invoice_number: 'INV-001',
        customer_id: 'cu1',
        total_amount: 50000,
        payment_status: 'paid',
        invoice_date: '2024-03-01'
      }
    ]);
  }),

  http.get('http://localhost:3001/api/products', () => {
    return HttpResponse.json([
      {
        id: 'p1',
        name: 'Gold Ring',
        selling_price: 25000,
        quantity: 10,
        min_stock_alert: 5
      }
    ]);
  }),

  http.get('http://localhost:3001/api/customers', () => {
    return HttpResponse.json([
      {
        id: 'cu1',
        name: 'Anita Desai',
        total_purchases: 500000,
        loyalty_points: 5000,
        created_at: '2023-01-01'
      }
    ]);
  }),

  http.get('http://localhost:3001/api/repairs', () => {
    return HttpResponse.json([
      {
        id: 'r1',
        order_number: 'REP-001',
        customer_id: 'cu1',
        status: 'received',
        item_description: 'Gold Chain',
        estimated_date: '2024-03-10',
        total_estimate: 5000
      }
    ]);
  }),

  http.get('http://localhost:3001/api/categories', () => {
    return HttpResponse.json([
      { id: 'c1', name: 'Gold Rings', metal_type: 'gold' }
    ]);
  }),

  http.get('http://localhost:3001/api/store', () => {
    return HttpResponse.json({
      id: 's1',
      name: 'Mehta Jewellers',
      address: 'Mumbai',
      gst_number: '27AABCM1234A1Z5',
      phone: '+91 98765 43210',
      currency: 'INR',
      tax_rate: 3
    });
  }),

  http.get('http://localhost:3001/api/users', () => {
    return HttpResponse.json([
      { id: 'u1', name: 'Rajesh Mehta', email: 'rajesh@mehtajewellers.com', role: 'owner' }
    ]);
  })
];

export const server = setupServer(...handlers);
