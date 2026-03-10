import { IndianRupee, Package, Wrench, Users, AlertTriangle, Loader2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { 
  formatCurrency, formatDate 
} from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { 
  useInvoices, 
  useProducts, 
  useCustomers, 
  useRepairs, 
  useDashboardStats, 
  getCustomerName, 
  useMetalRates, 
  calculateProductPrice,
  useStore,
  updateStoreSubPromptTs 
} from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showSubscription, setShowSubscription] = useState(false);
  const [subStatus, setSubStatus] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
  const { data: repairs = [], isLoading: loadingRepairs } = useRepairs();
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: metalRatesData } = useMetalRates();
  const { data: store } = useStore();
  const rates = metalRatesData?.rates;

  const isLoading = loadingInvoices || loadingProducts || loadingCustomers || loadingRepairs || loadingStats;

  useEffect(() => {
    const checkSubscription = async () => {
      // Only show subscription prompts to owners
      if (!user || user.role !== 'owner' || !store) return;

      try {
        const resp = await fetch(`${API_BASE_URL}/subscription/status?storeId=${store.id}`);
        const data = await resp.json();
        if (data.success) {
          const nowTs = Date.now();
          const lastTs = store.sub_prompt_ts ? parseInt(String(store.sub_prompt_ts), 10) : 0;
          const cooldownMs = 24 * 60 * 60 * 1000;
          const cooldownOk = nowTs - lastTs > cooldownMs;
          const trialRemaining = Number(data.trial_remaining ?? 0);
          const threshold = 3;
          const randomOk = Math.random() < 0.5;
          
          if (data.plan_status !== 'active' && trialRemaining <= threshold && cooldownOk && randomOk) {
            setSubStatus(data);
            setShowSubscription(true);
            await updateStoreSubPromptTs(store.id, nowTs);
          }
        }
      } catch (e) {
        console.error("Subscription check error:", e);
      }
    };
    checkSubscription();
  }, [user, store]);

  useEffect(() => {
    const checkOffer = async () => {
      // Only show offer prompts to owners
      if (!user || user.role !== 'owner') return;

      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const u = JSON.parse(userStr);
        const resp = await fetch(`${API_BASE_URL}/subscription/offer-status?storeId=${u.store_id}`);
        const data = await resp.json();
        if (data.success && data.eligible) {
          setShowOnboarding(true);
        }
      } catch {}
    };
    checkOffer();
  }, [user]);

  const claimOnboarding = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const u = JSON.parse(userStr);
      const resp = await fetch(`${API_BASE_URL}/subscription/claim-onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: u.store_id })
      });
      const data = await resp.json();
      if (data.success) {
        setShowOnboarding(false);
        setSubStatus((s: any) => ({ ...s, plan_status: 'active', plan_name: 'premium' }));
        toast({ title: "Premium Activated", description: "Enjoy 2 months of full premium access." });
      } else {
        toast({ title: "Error", description: data.message || "Failed to claim offer", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to claim offer", variant: "destructive" });
    }
  };

  const createPaymentLink = async () => {
    try {
      const u = user;
      if (!u) return;
      window.open(`${API_BASE_URL}/subscription/qr?storeId=${u.store_id}`, '_blank');
      toast({ title: "Payment Options", description: "Choose Razorpay QR or UPI to pay." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to open payment options", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted/50" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4 h-80 rounded-xl bg-muted/50" />
          <div className="lg:col-span-3 h-80 rounded-xl bg-muted/50" />
        </div>
      </div>
    );
  }

  const calculateProductValue = (p: any) => {
    return calculateProductPrice(p, rates) * (p.quantity || 0);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = invoices.filter((i: any) => i.invoice_date === todayStr && i.payment_status === 'paid').reduce((s: number, i: any) => s + i.total_amount, 0);
  const totalInventoryValue = products.reduce((s: number, p: any) => s + calculateProductValue(p), 0);
  const pendingRepairs = repairs.filter((r: any) => r.status !== 'delivered').length;

  // Metal weight breakdown
  const goldWeight = products
    .filter((p: any) => p.metal_type?.toLowerCase() === 'gold')
    .reduce((sum: number, p: any) => sum + (Number(p.net_weight) || 0) * (Number(p.quantity) || 0), 0);
  
  const silverWeight = products
    .filter((p: any) => p.metal_type?.toLowerCase() === 'silver')
    .reduce((sum: number, p: any) => sum + (Number(p.net_weight) || 0) * (Number(p.quantity) || 0), 0);
  
  const platinumWeight = products
    .filter((p: any) => p.metal_type?.toLowerCase() === 'platinum')
    .reduce((sum: number, p: any) => sum + (Number(p.net_weight) || 0) * (Number(p.quantity) || 0), 0);
  
  // Calculate trends
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdaySales = invoices.filter((i: any) => i.invoice_date === yesterdayStr && i.payment_status === 'paid').reduce((s: number, i: any) => s + i.total_amount, 0);
  
  const salesTrend = yesterdaySales > 0 
    ? `${(((todaySales - yesterdaySales) / yesterdaySales) * 100).toFixed(0)}% from yesterday`
    : todaySales > 0 ? "New sales today" : "No sales today";
  const isPositiveTrend = todaySales >= yesterdaySales;

  const lowStockProducts = products.filter((p: any) => p.quantity <= p.min_stock_alert);

  const salesLast7Days = stats?.salesLast7Days || [];
  const salesByMetal = stats?.salesByMetal || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Welcome! Claim 2 Months of Premium — Free</DialogTitle>
            <DialogDescription>
              Unlock every premium capability right now. No card required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <ul className="list-disc pl-5 text-sm">
              <li>Higher monthly limits for invoices and products</li>
              <li>All modules: Billing, Inventory, Reports, Repairs, Customers</li>
              <li>Beautiful GST-inclusive invoices with elegant PDF export</li>
              <li>Faster support and priority reliability</li>
              <li>Integrated payment options with QR & UPI</li>
            </ul>
            <div className="pt-2 flex gap-2">
              <Button onClick={claimOnboarding} className="bg-primary text-primary-foreground hover:bg-gold-dark">
                Claim Free Premium
              </Button>
              <Button variant="outline" onClick={() => setShowOnboarding(false)}>
                Not Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showSubscription} onOpenChange={(o) => setShowSubscription(o)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upgrade to Base Plan — ₹100/month</DialogTitle>
            <DialogDescription>
              Unlock full access and monthly limits. Pay securely via Razorpay.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Plan Status</span>
              <Badge variant={subStatus?.plan_status === 'trial' ? 'secondary' : 'destructive'}>
                {subStatus?.plan_status || 'trial'}
              </Badge>
            </div>
            <ul className="list-disc pl-5 text-sm">
              <li>Generate up to 200 invoices per month</li>
              <li>Add up to 100 products per month</li>
              <li>All modules: Billing, Inventory, Reports, Repairs, Customers</li>
              <li>GST-inclusive invoices and elegant PDF export</li>
              <li>UPI QR code for instant payments</li>
              <li>Priority updates and reliability</li>
            </ul>
            {subStatus?.plan_status === 'trial' && (
              <p className="text-xs text-muted-foreground">Trial credits remaining: {subStatus?.trial_remaining ?? 10}</p>
            )}
            <div className="pt-2 flex gap-2">
              <Button onClick={createPaymentLink} className="bg-primary text-primary-foreground hover:bg-gold-dark">
                Pay ₹100 — Upgrade Now
              </Button>
              <Button variant="outline" onClick={() => setShowSubscription(false)}>
                Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div>
        <h1 className="text-2xl font-bold font-display">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.name?.split(' ')[0]}. Here's your store overview.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(todaySales)}
          subtitle={`${invoices.filter(i => i.invoice_date === todayStr && i.payment_status === 'paid').length} invoices`}
          icon={<IndianRupee className="h-5 w-5" />}
          trend={{ value: salesTrend, positive: isPositiveTrend }}
        />
        <div className="space-y-2">
          <StatCard
            title="Inventory Value"
            value={formatCurrency(totalInventoryValue)}
            subtitle={`${products.length} products`}
            icon={<Package className="h-5 w-5" />}
          />
          <div className="flex gap-2 px-1">
            {goldWeight > 0 && (
              <div className="flex flex-col rounded-lg border bg-card/50 px-3 py-1.5 shadow-sm">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Gold</span>
                <span className="text-xs font-bold text-primary">{goldWeight.toFixed(2)}g</span>
              </div>
            )}
            {silverWeight > 0 && (
              <div className="flex flex-col rounded-lg border bg-card/50 px-3 py-1.5 shadow-sm">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Silver</span>
                <span className="text-xs font-bold text-blue-500">{silverWeight.toFixed(2)}g</span>
              </div>
            )}
            {platinumWeight > 0 && (
              <div className="flex flex-col rounded-lg border bg-card/50 px-3 py-1.5 shadow-sm">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Platinum</span>
                <span className="text-xs font-bold text-slate-500">{platinumWeight.toFixed(2)}g</span>
              </div>
            )}
          </div>
        </div>
        <StatCard
          title="Pending Repairs"
          value={String(pendingRepairs)}
          subtitle={`${repairs.filter((r: any) => r.status === 'received').length} new received`}
          icon={<Wrench className="h-5 w-5" />}
        />
        <StatCard
          title="Total Customers"
          value={String(customers.length)}
          subtitle="Growth in your store"
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Sales — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesLast7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Sales by Metal Type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={salesByMetal}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                dataKey="value"
                paddingAngle={4}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {salesByMetal.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <div className="rounded-xl border bg-card">
          <div className="border-b p-4">
            <h3 className="text-sm font-semibold">Recent Invoices</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.slice(0, 5).map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium text-sm">{inv.invoice_number}</TableCell>
                  <TableCell className="text-sm">{getCustomerName(customers, inv.customer_id)}</TableCell>
                  <TableCell className="text-right text-sm">{formatCurrency(inv.total_amount)}</TableCell>
                  <TableCell><StatusBadge status={inv.payment_status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Low Stock + Repairs */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card">
            <div className="flex items-center gap-2 border-b p-4">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h3 className="text-sm font-semibold">Low Stock Alerts</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-center">Min</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm font-medium">{p.name}</TableCell>
                    <TableCell className="text-center">
                      <span className={p.quantity === 0 ? "text-destructive font-bold" : "text-primary font-bold"}>
                        {p.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">{p.min_stock_alert}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-xl border bg-card">
            <div className="border-b p-4">
              <h3 className="text-sm font-semibold">Pending Repairs</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairs.filter((r: any) => r.status !== 'delivered').map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium">{r.order_number}</TableCell>
                    <TableCell className="text-sm">{getCustomerName(customers, r.customer_id)}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
