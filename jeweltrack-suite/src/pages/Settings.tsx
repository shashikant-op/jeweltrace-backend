import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  useStore, 
  useUsers, 
  useCategories, 
  updateStore, 
  updateUser, 
  createUser,
  createCategory, 
  deleteCategory 
} from "@/lib/api";
import { Loader2, Plus, Trash2, Save, UserPlus, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect as useReactEffect } from "react";
import { useMetalRates, updateMetalRates } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function SettingsPage() {
  const { data: store, isLoading: loadingStore } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Role-based guard: only owner can access settings
  if (user && user.role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }

  const StoreProfileSection = () => {
    const [profileForm, setProfileForm] = useState({
      name: "",
      phone: "",
      address: "",
      gst_number: "",
      upi_id: ""
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      if (store) {
        setProfileForm({
          name: store.name || "",
          phone: store.phone || "",
          address: store.address || "",
          gst_number: store.gst_number || "",
          upi_id: store.upi_id || ""
        });
      }
    }, [store]);

    const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!store?.id) return;
      setSaving(true);
      try {
        await updateStore(store.id, { 
          name: profileForm.name,
          phone: profileForm.phone,
          address: profileForm.address,
          gst_number: profileForm.gst_number,
          upi_id: profileForm.upi_id,
          tax_rate: store?.tax_rate ?? 3
        });
        queryClient.invalidateQueries({ queryKey: ['store'] });
        toast({ title: "Success", description: "Store profile updated successfully" });
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to update store profile", variant: "destructive" });
      } finally {
        setSaving(false);
      }
    };

    return (
      <form onSubmit={onSubmit} className="rounded-xl border bg-card p-6 max-w-2xl space-y-6 shadow-sm">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Business Identity</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input 
                id="storeName"
                value={profileForm.name} 
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                placeholder="e.g. Royal Jewelers"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storePhone">Phone Number</Label>
              <Input 
                id="storePhone"
                value={profileForm.phone} 
                onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="storeAddress">Store Address</Label>
            <Input 
              id="storeAddress"
              value={profileForm.address} 
              onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
              placeholder="Street, City, State, ZIP"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input 
                id="gstNumber"
                value={profileForm.gst_number} 
                onChange={(e) => setProfileForm({...profileForm, gst_number: e.target.value})}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
              <Input id="invoicePrefix" defaultValue="INV" disabled className="bg-muted/30" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="upiId">UPI ID (for payments)</Label>
            <Input 
              id="upiId"
              value={profileForm.upi_id} 
              onChange={(e) => setProfileForm({...profileForm, upi_id: e.target.value})}
              placeholder="e.g. storename@upi"
            />
            <p className="text-[10px] text-muted-foreground italic">Required for generating QR codes at billing</p>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <Button 
            type="submit" 
            className="bg-primary text-primary-foreground hover:bg-gold-dark min-w-[140px]"
            disabled={saving}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Profile
          </Button>
        </div>
      </form>
    );
  };

  const TaxSection = () => {
    const [taxRate, setTaxRate] = useState<number>(3);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      if (store?.tax_rate != null) {
        setTaxRate(store.tax_rate);
      }
    }, [store?.tax_rate]);

    const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!store?.id) return;
      setSaving(true);
      try {
        await updateStore(store.id, { tax_rate: taxRate });
        queryClient.invalidateQueries({ queryKey: ['store'] });
        toast({ title: "Success", description: "Tax settings updated successfully" });
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to update tax settings", variant: "destructive" });
      } finally {
        setSaving(false);
      }
    };

    return (
      <form onSubmit={onSubmit} className="rounded-xl border bg-card p-6 max-w-2xl space-y-6 shadow-sm">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Taxation & Currency</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Default GST Rate (%)</Label>
              <Input 
                id="taxRate"
                type="number" 
                step="0.01"
                value={taxRate} 
                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
              />
              <p className="text-[10px] text-muted-foreground">Standard jewelry GST is 3% in India</p>
            </div>
            <div className="space-y-2">
              <Label>Base Currency</Label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/30 text-muted-foreground text-sm">
                <span>Indian Rupee (₹)</span>
                <Badge variant="secondary" className="text-[10px] py-0">Default</Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <Button 
            type="submit" 
            className="bg-primary text-primary-foreground hover:bg-gold-dark min-w-[140px]"
            disabled={saving}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Update Settings
          </Button>
        </div>
      </form>
    );
  };

  const NotificationPrefsSection = () => {
    const [lowStock, setLowStock] = useState<boolean>(true);
    const [repairDue, setRepairDue] = useState<boolean>(true);
    const [dailySummary, setDailySummary] = useState<boolean>(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      if (store?.id) {
        const raw = localStorage.getItem(`store_prefs_${store.id}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setLowStock(Boolean(parsed.lowStock));
            setRepairDue(Boolean(parsed.repairDue));
            setDailySummary(Boolean(parsed.dailySummary));
          } catch {}
        }
      }
    }, [store]);

    const onSave = async () => {
      if (!store?.id) return;
      setSaving(true);
      try {
        localStorage.setItem(`store_prefs_${store.id}`, JSON.stringify({
          lowStock, repairDue, dailySummary
        }));
        toast({ title: "Success", description: "Preferences saved" });
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to save preferences", variant: "destructive" });
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="rounded-xl border bg-card p-6 max-w-2xl space-y-6 shadow-sm">
        <h3 className="text-lg font-semibold">Automation & Alerts</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Low Stock Alerts</p>
              <p className="text-xs text-muted-foreground">Notify when items reach minimum stock level</p>
            </div>
            <Switch checked={lowStock} onCheckedChange={setLowStock} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Repair Due Reminders</p>
              <p className="text-xs text-muted-foreground">Notify when repairs are due or overdue</p>
            </div>
            <Switch checked={repairDue} onCheckedChange={setRepairDue} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Daily Sales Summary</p>
              <p className="text-xs text-muted-foreground">Email summary of daily sales at end of day</p>
            </div>
            <Switch checked={dailySummary} onCheckedChange={setDailySummary} />
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <Button onClick={onSave} className="bg-primary text-primary-foreground hover:bg-gold-dark min-w-[140px]" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Preferences
          </Button>
        </div>
      </div>
    );
  };

  const SubscriptionSection = () => {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useReactEffect(() => {
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

    const activateManually = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const user = JSON.parse(userStr || '{}');
        const resp = await fetch(`http://localhost:3001/api/subscription/activate?storeId=${user.store_id}`);
        const data = await resp.json();
        if (data.success) {
          toast({ title: "Plan Activated", description: "Base plan is now active." });
          setStatus((s: any) => ({ ...s, plan_status: 'active' }));
        } else {
          toast({ title: "Error", description: data.message || "Failed to activate plan", variant: "destructive" });
        }
      } catch (e: any) {
        toast({ title: "Error", description: e.message || "Failed to activate plan", variant: "destructive" });
      }
    };

    return (
      <div className="rounded-xl border bg-card p-6 max-w-2xl space-y-6 shadow-sm">
        <h3 className="text-lg font-semibold">Subscription</h3>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : (
          <>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Plan Status</span>
                <Badge variant={status?.plan_status === 'active' ? 'default' : status?.plan_status === 'trial' ? 'secondary' : 'destructive'}>
                  {status?.plan_status || 'trial'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Invoices this month</span>
                <span className="font-medium">{status?.invoices_this_month ?? 0} / {status?.plan_status === 'active' ? 200 : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Products added this month</span>
                <span className="font-medium">{status?.products_this_month ?? 0} / {status?.plan_status === 'active' ? 100 : '—'}</span>
              </div>
              {status?.plan_status === 'trial' && (
                <div className="flex items-center justify-between">
                  <span>Trial invoice credits remaining</span>
                  <span className="font-medium">{status?.trial_remaining ?? 10}</span>
                </div>
              )}
            </div>
            <div className="pt-4 border-t flex gap-2">
              <Button onClick={createPaymentLink} disabled={creating} className="bg-primary text-primary-foreground hover:bg-gold-dark">
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Upgrade to Base (₹100/month)
              </Button>
              <Button variant="outline" onClick={activateManually}>
                Activate Manually
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  const StaffSection = () => {
    const { data: users = [], isLoading: loadingUsers } = useUsers();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUser, setNewUser] = useState({
      name: "",
      email: "",
      password: "",
      role: "salesperson"
    });
    const [adding, setAdding] = useState(false);

    const handleAddUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUser.name || !newUser.email || !newUser.password) {
        toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
        return;
      }
      
      setAdding(true);
      try {
        await createUser(newUser);
        queryClient.invalidateQueries({ queryKey: ['users'] });
        toast({ title: "Success", description: `${newUser.name} added as ${newUser.role}` });
        setNewUser({ name: "", email: "", password: "", role: "salesperson" });
        setIsAddingUser(false);
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to add staff member", variant: "destructive" });
      } finally {
        setAdding(false);
      }
    };

    return (
      <>
        {loadingUsers ? <ListSkeleton /> : (
          <div className="rounded-xl border bg-card max-w-2xl shadow-sm overflow-hidden">
            <div className="bg-muted/30 p-4 flex items-center justify-between border-b">
              <div>
                <h3 className="text-sm font-semibold">Team Members</h3>
                <p className="text-xs text-muted-foreground">Manage roles and permissions</p>
              </div>
              
              <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-gold-dark">
                    <UserPlus className="mr-2 h-3 w-3" /> Invite Staff
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddUser} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="staffName">Full Name</Label>
                      <Input 
                        id="staffName" 
                        value={newUser.name}
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        placeholder="e.g. Rahul Sharma" 
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="staffEmail">Email Address</Label>
                      <Input 
                        id="staffEmail" 
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        placeholder="rahul@example.com" 
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="staffPass">Temporary Password</Label>
                      <Input 
                        id="staffPass" 
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="••••••••" 
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="staffRole">Access Level</Label>
                      <Select 
                        value={newUser.role}
                        onValueChange={(val) => setNewUser({...newUser, role: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="salesperson">Salesperson</SelectItem>
                          <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter className="pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddingUser(false)}>Cancel</Button>
                      <Button type="submit" disabled={adding}>
                        {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create Account
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="divide-y">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                        {u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{u.name}</p>
                        {u.role === 'owner' && <CheckCircle2 className="h-3 w-3 text-blue-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={u.role === 'owner' ? 'default' : u.role === 'manager' ? 'secondary' : 'outline'} 
                      className={`capitalize px-2 py-0 text-[10px] ${
                        u.role === 'manager' ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100' : ''
                      }`}
                    >
                      {u.role}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  const CategoriesSection = () => {
    const { data: categories = [], isLoading: loadingCategories } = useCategories();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: "", metal_type: "gold" });

    const handleAddCategory = async () => {
      if (!newCategory.name) return;
      try {
        await createCategory(newCategory);
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        setNewCategory({ name: "", metal_type: "gold" });
        setIsAddingCategory(false);
        toast({
          title: "Success",
          description: "Category added successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to add category",
          variant: "destructive"
        });
      }
    };

    const handleDeleteCategory = async (id: string) => {
      if (!confirm("Are you sure you want to delete this category?")) return;
      try {
        await deleteCategory(id);
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        toast({
          title: "Success",
          description: "Category deleted successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete category",
          variant: "destructive"
        });
      }
    };

    return (
      <>
        {loadingCategories ? <ListSkeleton /> : (
          <div className="rounded-xl border bg-card max-w-2xl shadow-sm overflow-hidden">
            <div className="bg-muted/30 p-4 flex items-center justify-between border-b">
              <div>
                <h3 className="text-sm font-semibold">Product Categories</h3>
                <p className="text-xs text-muted-foreground">Categorize your inventory</p>
              </div>
              
              <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-gold-dark">
                    <Plus className="mr-2 h-3 w-3" /> Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="catName">Category Name</Label>
                      <Input 
                        id="catName" 
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                        placeholder="e.g. Diamond Necklaces" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="metalType">Metal Type</Label>
                      <Select 
                        value={newCategory.metal_type}
                        onValueChange={(val) => setNewCategory({...newCategory, metal_type: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select metal type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gold">Gold</SelectItem>
                          <SelectItem value="silver">Silver</SelectItem>
                          <SelectItem value="platinum">Platinum</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingCategory(false)}>Cancel</Button>
                    <Button onClick={handleAddCategory}>Add Category</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="divide-y">
              {categories.map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[9px] uppercase tracking-wider h-4">
                        {c.metal_type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground italic">{c.description || "No description"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteCategory(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm italic">
                  No categories defined. Click "Add Category" to get started.
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  const StoreSkeleton = () => (
    <div className="rounded-xl border bg-card p-6 max-w-2xl space-y-6 animate-pulse">
      <div className="h-6 w-32 bg-muted rounded mb-4" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><div className="h-4 w-20 bg-muted rounded" /><div className="h-10 bg-muted rounded" /></div>
        <div className="space-y-2"><div className="h-4 w-20 bg-muted rounded" /><div className="h-10 bg-muted rounded" /></div>
      </div>
      <div className="space-y-2"><div className="h-4 w-20 bg-muted rounded" /><div className="h-10 bg-muted rounded" /></div>
      <div className="h-10 w-32 bg-muted rounded" />
    </div>
  );

  const ListSkeleton = () => (
    <div className="rounded-xl border bg-card max-w-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="bg-muted/30 p-4 border-b h-16" />
      <div className="divide-y">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="space-y-2"><div className="h-4 w-24 bg-muted rounded" /><div className="h-3 w-32 bg-muted rounded" /></div>
            </div>
            <div className="h-6 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold font-display">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your store configuration and preferences</p>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="store">Store Profile</TabsTrigger>
          <TabsTrigger value="tax">Tax & Pricing</TabsTrigger>
          <TabsTrigger value="metals">Metal Rates</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="store">
          {loadingStore ? <StoreSkeleton /> : <StoreProfileSection />}
        </TabsContent>

        <TabsContent value="tax">
          {loadingStore ? <StoreSkeleton /> : <TaxSection />}
        </TabsContent>

        <TabsContent value="metals">
          <MetalRatesSection />
        </TabsContent>

        <TabsContent value="staff">
          <StaffSection />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesSection />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationPrefsSection />
        </TabsContent>

      </Tabs>
    </div>
  );
}

function MetalRatesSection() {
  const { data, isLoading } = useMetalRates();
  const { toast } = useToast();
  const [form, setForm] = useState({
    gold_24k_per_gm: "",
    gold_22k_per_gm: "",
    gold_18k_per_gm: "",
    silver_per_gm: "",
    platinum_per_gm: ""
  });
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const rates = data?.rates;
    if (rates) {
      setForm({
        gold_24k_per_gm: (rates.gold_24k_per_gm ?? "").toString(),
        gold_22k_per_gm: (rates.gold_22k_per_gm ?? "").toString(),
        gold_18k_per_gm: (rates.gold_18k_per_gm ?? "").toString(),
        silver_per_gm: (rates.silver_per_gm ?? "").toString(),
        platinum_per_gm: (rates.platinum_per_gm ?? "").toString()
      });
    }
  }, [data?.rates]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateMetalRates({
        gold_24k_per_gm: parseFloat(form.gold_24k_per_gm) || 0,
        gold_22k_per_gm: parseFloat(form.gold_22k_per_gm) || 0,
        gold_18k_per_gm: parseFloat(form.gold_18k_per_gm) || 0,
        silver_per_gm: parseFloat(form.silver_per_gm) || 0,
        platinum_per_gm: parseFloat(form.platinum_per_gm) || 0
      });
      queryClient.invalidateQueries({ queryKey: ['metal-rates'] });
      toast({ title: "Saved", description: "Metal rates updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update rates", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-xl border bg-card p-6 max-w-2xl space-y-6 shadow-sm">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Metal Rates (₹ per gram)</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="g24">Gold 24k (999)</Label>
            <Input id="g24" type="number" step="0.01" value={form.gold_24k_per_gm} onChange={(e) => setForm({ ...form, gold_24k_per_gm: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g22">Gold 22k (916)</Label>
            <Input id="g22" type="number" step="0.01" value={form.gold_22k_per_gm} onChange={(e) => setForm({ ...form, gold_22k_per_gm: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g18">Gold 18k</Label>
            <Input id="g18" type="number" step="0.01" value={form.gold_18k_per_gm} onChange={(e) => setForm({ ...form, gold_18k_per_gm: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="silver">Silver</Label>
            <Input id="silver" type="number" step="0.01" value={form.silver_per_gm} onChange={(e) => setForm({ ...form, silver_per_gm: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platinum">Platinum</Label>
            <Input id="platinum" type="number" step="0.01" value={form.platinum_per_gm} onChange={(e) => setForm({ ...form, platinum_per_gm: e.target.value })} />
          </div>
        </div>
      </div>
      <div className="pt-4 border-t">
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-gold-dark min-w-[140px]" disabled={saving || isLoading}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Rates
        </Button>
      </div>
    </form>
  );
}
