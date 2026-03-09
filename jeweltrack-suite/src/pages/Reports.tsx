import { formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useInvoices, useProducts, useCustomers, useCategories, getCategoryName, useMetalRates, calculateProductPrice } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function Reports() {
  const { user } = useAuth();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();

  // Role-based guard: only owner and manager can access reports
  if (user && !['owner', 'manager'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
  const { data: categories = [] } = useCategories();
  const { data: metalRatesData } = useMetalRates();
  const rates = metalRatesData?.rates;

  if (loadingInvoices || loadingProducts || loadingCustomers) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalRevenue = invoices.reduce((s: number, i: any) => s + i.total_amount, 0);
  const avgOrderValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;

  const topProducts = [...products]
    .sort((a: any, b: any) => calculateProductPrice(b, rates) - calculateProductPrice(a, rates))
    .slice(0, 5);

  const colorPalette = [
    'hsl(38, 92%, 50%)',
    'hsl(217, 91%, 60%)',
    'hsl(160, 84%, 39%)',
    'hsl(280, 65%, 60%)',
    'hsl(215, 20%, 65%)',
    'hsl(24, 90%, 60%)',
    'hsl(343, 81%, 51%)',
  ];

  const categoryRevenueMap: Record<string, number> = {};
  invoices.forEach((inv: any) => {
    (inv.items || []).forEach((item: any) => {
      let catName = 'Uncategorized';
      if (item.product_id) {
        const prod = products.find((p: any) => p.id === item.product_id);
        if (prod?.category_id) {
          catName = getCategoryName(categories, prod.category_id);
        }
      }
      categoryRevenueMap[catName] = (categoryRevenueMap[catName] || 0) + (item.total_price || 0);
    });
  });
  const salesByCategory = Object.entries(categoryRevenueMap)
    .map(([name, revenue], idx) => ({ name, revenue, fill: colorPalette[idx % colorPalette.length] }))
    .sort((a, b) => b.revenue - a.revenue);

  const paymentCounts: Record<string, number> = { cash: 0, card: 0, upi: 0, cheque: 0, other: 0 };
  invoices.forEach((i: any) => {
    const m = (i.payment_method || 'other').toLowerCase();
    paymentCounts[m] = (paymentCounts[m] || 0) + 1;
  });
  const paymentMethods = [
    { name: 'Cash', value: paymentCounts.cash || 0, fill: 'hsl(160, 84%, 39%)' },
    { name: 'Card', value: paymentCounts.card || 0, fill: 'hsl(38, 92%, 50%)' },
    { name: 'UPI', value: paymentCounts.upi || 0, fill: 'hsl(217, 91%, 60%)' },
    { name: 'Cheque', value: paymentCounts.cheque || 0, fill: 'hsl(280, 65%, 60%)' },
  ].filter(e => e.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display">Reports</h1>
        <p className="text-sm text-muted-foreground">Business analytics and insights</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold font-display mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Invoices</p>
          <p className="text-2xl font-bold font-display mt-1">{invoices.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Avg Order Value</p>
          <p className="text-2xl font-bold font-display mt-1">{formatCurrency(avgOrderValue)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                {salesByCategory.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={60} outerRadius={95} dataKey="value" paddingAngle={4}
                label={({ name, value }) => `${name} (${value})`}>
                {paymentMethods.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold">Top Products by Price</h3>
        <div className="space-y-3">
          {topProducts.map((p, i) => (
            <div key={p.id} className="flex items-center gap-4">
              <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{p.metal_type} · {p.karat}</p>
              </div>
              <span className="font-bold">{formatCurrency(calculateProductPrice(p, rates))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
