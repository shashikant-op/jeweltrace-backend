import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function Subscription() {
  const { user } = useAuth();

  // Role-based guard: only owner can access subscription
  if (user && user.role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }

  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const formatDateLocal = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }) : '—';

  useEffect(() => {
    const load = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        const resp = await fetch(`http://localhost:3001/api/subscription/status?storeId=${user.store_id}`);
        const data = await resp.json();
        if (data.success) setStatus(data);
      } catch {}
    };
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []);

  const createPaymentLink = async () => {
    try {
      setCreating(true);
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr || '{}');
      window.open(`http://localhost:3001/api/subscription/qr?storeId=${user.store_id}`, '_blank');
      toast({ title: "Payment Options", description: "Choose Razorpay QR or UPI to pay." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to open payment options", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const verifyPayment = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr || '{}');
      const resp = await fetch(`http://localhost:3001/api/subscription/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: user.store_id })
      });
      const data = await resp.json();
      if (data.success) {
        toast({ title: "Payment Verified", description: "Base plan is now active." });
        setStatus((s: any) => ({ ...s, plan_status: 'active' }));
      } else {
        toast({ title: "Error", description: data.message || "Payment not completed yet", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to verify payment", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display">Subscription</h1>
        <p className="text-sm text-muted-foreground">Manage your plan and usage</p>
      </div>
      <div className="rounded-xl border bg-card p-6 max-w-2xl space-y-6 shadow-sm">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : (
          <>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Plan Name</span>
                <Badge variant="secondary" className="capitalize">{status?.plan_name || 'base'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Plan Status</span>
                <Badge variant={(() => {
                  const pe = status?.premium_expires_at ? new Date(status.premium_expires_at) : null;
                  const activePremium = status?.plan_name === 'premium' && status?.plan_status === 'active' && pe && pe > new Date();
                  return activePremium ? 'default' : (status?.plan_status === 'trial' ? 'secondary' : 'destructive');
                })()}>
                  {(() => {
                    const pe = status?.premium_expires_at ? new Date(status.premium_expires_at) : null;
                    const activePremium = status?.plan_name === 'premium' && status?.plan_status === 'active' && pe && pe > new Date();
                    if (status?.plan_name === 'premium') {
                      return activePremium ? 'active' : 'expired';
                    }
                    return status?.plan_status || 'trial';
                  })()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Activation Date</span>
                <span className="font-medium">{formatDateLocal(status?.plan_started_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Expiry Date</span>
                <span className="font-medium">{status?.plan_name === 'premium' ? formatDateLocal(status?.premium_expires_at) : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Invoices this month</span>
                <span className="font-medium">
                  {status?.invoices_this_month ?? 0} / {status?.plan_name === 'premium' ? 1000 : (status?.plan_status === 'active' ? 200 : '—')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Products added this month</span>
                <span className="font-medium">
                  {status?.products_this_month ?? 0} / {status?.plan_name === 'premium' ? 500 : (status?.plan_status === 'active' ? 100 : '—')}
                </span>
              </div>
              {status?.plan_status === 'trial' && (
                <div className="flex items-center justify-between">
                  <span>Trial invoice credits remaining</span>
                  <span className="font-medium">{status?.trial_remaining ?? 10}</span>
                </div>
              )}
            </div>
            <div className="space-y-3 pt-2 border-t">
              <div>
                <h2 className="text-lg font-semibold">Upgrade to Premium — ₹1500/month</h2>
                <p className="text-sm text-muted-foreground">Unlock full access and higher monthly limits. Pay securely via Razorpay.</p>
              </div>
              <ul className="list-disc pl-5 text-sm">
                <li>Generate up to 1000 invoices per month</li>
                <li>Add up to 500 products per month</li>
                <li>All modules: Billing, Inventory, Reports, Repairs, Customers</li>
                <li>GST-inclusive invoices and elegant PDF export</li>
                <li>UPI QR code for instant payments</li>
                <li>Priority updates and reliability</li>
              </ul>
              {status?.plan_status === 'trial' && (
                <p className="text-xs text-muted-foreground">Trial credits remaining: {status?.trial_remaining ?? 10}</p>
              )}
            </div>
            {(() => {
              const pe = status?.premium_expires_at ? new Date(status.premium_expires_at) : null;
              const premiumActive = status?.plan_name === 'premium' && status?.plan_status === 'active' && pe && pe > new Date();
              if (premiumActive) return null;
              return (
                <div className="pt-4 border-t flex gap-2">
                  <Button onClick={createPaymentLink} disabled={creating} className="bg-primary text-primary-foreground hover:bg-gold-dark">
                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Pay ₹1500 — Upgrade to Premium
                  </Button>
                  <Button variant="outline" onClick={verifyPayment}>
                    I’ve Paid — Verify
                  </Button>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
