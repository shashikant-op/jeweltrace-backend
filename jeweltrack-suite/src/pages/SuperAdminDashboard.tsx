import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Store, 
  Users, 
  Package, 
  FileText, 
  Trash2, 
  ShieldAlert, 
  TrendingUp,
  LayoutDashboard,
  Search,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Activity,
  UserCheck,
  Trophy,
  DollarSign,
  Box
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GlobalStats {
  totalStores: number;
  totalUsers: number;
  totalProducts: number;
  totalInvoices: number;
  totalRevenue: number;
  totalInventoryValue: number;
  totalPlatformEarnings: number;
}

interface StoreStat {
  id: string;
  name: string;
  userCount: number;
  productCount: number;
  invoiceCount: number;
  totalRevenue: number;
  inventoryValue: number;
}

interface StoreData {
  id: string;
  name: string;
  users: any[];
  store_quota: any;
  created_at: string;
}

interface AnalyticsData {
  revenueOverTime: any[];
  storeGrowth: any[];
  activeTrends: any[];
  subDistribution: any[];
  activeStores: any[];
}

interface StoreDetailData {
  store: StoreData;
  stats: {
    usersCount: number;
    productsCount: number;
    invoicesCount: number;
    customersCount: number;
  };
  recentInvoices: any[];
  topProducts: any[];
}

interface LeaderboardItem {
  id: string;
  name: string;
  totalRevenue: number;
  invoiceCount: number;
  inventoryValue: number;
  productCount: number;
}

const COLORS = ['#3a86ff', '#8338ec', '#ff006e', '#fb5607', '#ffbe0b'];

const SuperAdminDashboard = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001';
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [storeStats, setStoreStats] = useState<StoreStat[]>([]);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('30d');
  
  // Drill-down state
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [storeDetail, setStoreDetail] = useState<StoreDetailData | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  
  // Global search state
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{products: any[], invoices: any[], stores: any[]} | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  if (user && user.role !== 'superadmin') {
    return (
      <div className="p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>Only superadmin accounts can view this dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please log in with a superadmin account to view global metrics, manage stores, and users.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  useEffect(() => {
    fetchData();
    fetchAnalytics();
    fetchLeaderboard();
  }, [token]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  useEffect(() => {
    if (selectedStoreId) {
      fetchStoreDetail(selectedStoreId);
    } else {
      setStoreDetail(null);
    }
  }, [selectedStoreId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (globalSearch.length >= 2) {
        handleGlobalSearch();
      } else {
        setSearchResults(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [globalSearch]);

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [statsRes, storesRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/api/superadmin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/superadmin/stores`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/superadmin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const statsData = await statsRes.json();
      const storesData = await storesRes.json();
      const usersData = await usersRes.json();

      if (statsData.success) {
        setStats(statsData.stats);
        setStoreStats(statsData.storeStats);
      }
      if (storesData.success) setStores(storesData.stores);
      if (usersData.success) setUsers(usersData.users);
    } catch (error) {
      console.error('Error fetching superadmin data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch superadmin data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!token) return;
    setIsAnalyticsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/superadmin/analytics?range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const { success, ...payload } = data as any;
        setAnalytics(payload as AnalyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/superadmin/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchStoreDetail = async (id: string) => {
    setIsDetailLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/superadmin/stores/${id}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStoreDetail(data);
      }
    } catch (error) {
      console.error('Error fetching store detail:', error);
      toast({ title: "Error", description: "Failed to load store details", variant: "destructive" });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleGlobalSearch = async () => {
    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/api/superadmin/search?q=${encodeURIComponent(globalSearch)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('Global search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this store? This action is irreversible.')) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/superadmin/stores/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: "Store deleted successfully" });
        fetchData();
        if (selectedStoreId === id) setSelectedStoreId(null);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/superadmin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: "User role updated" });
        fetchData();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (user?.role !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  // --- STORE DRILL-DOWN VIEW ---
  if (selectedStoreId && storeDetail) {
    const { store, stats: storeStatsData, recentInvoices, topProducts } = storeDetail;
    const sStat = storeStats.find(ss => ss.id === selectedStoreId);
    
    return (
      <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="icon" onClick={() => setSelectedStoreId(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight">{store.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Badge variant="outline">ID: {store.id}</Badge>
              <Badge variant={store.store_quota?.plan_status === 'active' ? 'default' : 'secondary'}>
                {store.store_quota?.plan_name?.toUpperCase() || 'BASE'} {store.store_quota?.plan_status?.toUpperCase() || 'TRIAL'}
              </Badge>
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(sStat?.totalRevenue || 0).toLocaleString()}</div>
              <p className="text-[10px] text-muted-foreground mt-1">{storeStatsData.invoicesCount} total invoices</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <Box className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(sStat?.inventoryValue || 0).toLocaleString()}</div>
              <p className="text-[10px] text-muted-foreground mt-1">{storeStatsData.productsCount} total products</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeStatsData.customersCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeStatsData.usersCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Best performers by revenue in this store.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="product_name" type="category" width={100} fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(val) => `₹${val}`} />
                  <Bar dataKey="totalRevenue" fill="#3a86ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Latest transactions for {store.name}.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium text-xs">{inv.invoice_number}</TableCell>
                      <TableCell className="text-xs">{inv.customer?.name || 'Walk-in'}</TableCell>
                      <TableCell className="text-right text-xs">₹{inv.total_amount}</TableCell>
                    </TableRow>
                  ))}
                  {recentInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">No invoices yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SuperAdmin Dashboard</h1>
          <p className="text-muted-foreground">Advanced platform management and data drill-down.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Global search (products, invoices)..."
              className="pl-8 w-[300px] border-primary/20 focus:border-primary"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
            {searchResults && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl border-primary/20 max-h-[400px] overflow-y-auto animate-in zoom-in-95 duration-200">
                <CardContent className="p-2">
                  {searchResults.stores.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1">Stores</p>
                      {searchResults.stores.map(s => (
                        <div 
                          key={s.id} 
                          className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                          onClick={() => { setSelectedStoreId(s.id); setGlobalSearch(''); }}
                        >
                          <span className="text-sm font-medium">{s.name}</span>
                          <ChevronRight className="h-3 w-3 opacity-30" />
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.products.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1">Products</p>
                      {searchResults.products.map(p => (
                        <div key={p.id} className="p-2 hover:bg-muted rounded-md border-b last:border-0 border-muted-foreground/10">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium">{p.name}</span>
                            <Badge variant="secondary" className="text-[10px]">{p.store?.name}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Price: ₹{p.selling_price} | Stock: {p.quantity}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.invoices.length > 0 && (
                    <div className="mb-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1">Invoices</p>
                      {searchResults.invoices.map(i => (
                        <div key={i.id} className="p-2 hover:bg-muted rounded-md border-b last:border-0 border-muted-foreground/10">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-mono">{i.invoice_number}</span>
                            <Badge variant="secondary" className="text-[10px]">{i.store?.name}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Date: {i.invoice_date} | Total: ₹{i.total_amount}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {Object.values(searchResults).every(arr => arr.length === 0) && (
                    <div className="p-4 text-center text-sm text-muted-foreground">No results found for "{globalSearch}"</div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          <Button onClick={() => { fetchData(); fetchAnalytics(); fetchLeaderboard(); }} variant="outline" size="icon" className={isLoading ? "animate-spin" : ""}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stores</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStores || 0}</div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>
        <Card className="col-span-1 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Earnings</CardTitle>
            <Trophy className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats?.totalPlatformEarnings || 0).toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">From subscriptions</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Store Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats?.totalRevenue || 0).toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">{stats?.totalInvoices} total invoices</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <Box className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats?.totalInventoryValue || 0).toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">{stats?.totalProducts} unique products</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-[500px]">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="stores">Stores</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Cumulative Store Growth</CardTitle>
                <CardDescription>Total stores on the platform over time.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.storeGrowth || []}>
                    <defs>
                      <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8338ec" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#8338ec" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      name="Total Stores"
                      stroke="#8338ec" 
                      fillOpacity={1} 
                      fill="url(#colorGrowth)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="daily" 
                      name="New Stores"
                      stroke="#3a86ff" 
                      fillOpacity={0.1} 
                      fill="#3a86ff" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Conversion & Trends</CardTitle>
                <CardDescription>Trial to Active conversion activity.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.activeTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="New Active Subs" fill="#ff006e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Platform Revenue Over Time</CardTitle>
                <CardDescription>Daily gross revenue across all stores.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.revenueOverTime || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3a86ff" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3a86ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="invoice_date" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      formatter={(val) => [`₹${val}`, 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="daily_revenue" 
                      stroke="#3a86ff" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>Breakdown of store subscription plans.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.subDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="plan_name"
                    >
                      {(analytics?.subDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-7">
              <CardHeader>
                <CardTitle>Most Active Stores</CardTitle>
                <CardDescription>Stores with the highest transaction volume.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store Name</TableHead>
                      <TableHead className="text-right">Total Invoices</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(analytics?.activeStores || []).map((s) => (
                      <TableRow key={s.store_id} className="cursor-pointer group hover:bg-muted" onClick={() => setSelectedStoreId(s.store_id)}>
                        <TableCell className="font-medium">{s.storeName}</TableCell>
                        <TableCell className="text-right">{s.invoiceCount}</TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <CardTitle>Store Performance Leaderboard</CardTitle>
              </div>
              <CardDescription>Top performing stores by revenue and inventory size.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Rank</TableHead>
                    <TableHead>Store Name</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">Inventory Value</TableHead>
                    <TableHead className="text-right">Invoices</TableHead>
                    <TableHead className="text-right">Products</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((item, index) => (
                    <TableRow key={item.id} className="cursor-pointer hover:bg-muted" onClick={() => setSelectedStoreId(item.id)}>
                      <TableCell className="font-bold">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right text-blue-600 font-bold">₹{(Number(item.totalRevenue) || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-purple-600">₹{(Number(item.inventoryValue) || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{item.invoiceCount}</TableCell>
                      <TableCell className="text-right">{item.productCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Stores</CardTitle>
              <CardDescription>Detailed metrics per store.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter stores by name..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store Name</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Inv. Value</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores
                    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((s) => {
                      const stat = storeStats.find(ss => ss.id === s.id);
                      return (
                        <TableRow key={s.id} className="cursor-pointer group hover:bg-muted" onClick={() => setSelectedStoreId(s.id)}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {s.name}
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-blue-600">₹{(Number(stat?.totalRevenue) || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-purple-600">₹{(Number(stat?.inventoryValue) || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={s.store_quota?.plan_status === 'active' ? 'default' : 'secondary'}>
                              {s.store_quota?.plan_status || 'trial'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteStore(s.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.store?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'superadmin' ? 'destructive' : 'outline'}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <select 
                            className="text-sm border rounded px-2 py-1 bg-transparent"
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          >
                            <option value="superadmin">SuperAdmin</option>
                            <option value="owner">Owner</option>
                            <option value="manager">Manager</option>
                            <option value="salesperson">Salesperson</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminDashboard;
