import { useState } from "react";
import { Search, Plus, Download, LayoutGrid, List, Filter, Loader2, MoreVertical, Pencil, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useProducts, useCategories, getCategoryName, createProduct, updateProduct, deleteProduct, useMetalRates, calculateProductPrice } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function Inventory() {
  const { user } = useAuth();
  const isManagerOrOwner = user && ['owner', 'manager'].includes(user.role);
  const [search, setSearch] = useState("");
  const [metalFilter, setMetalFilter] = useState("all");
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category_id: "",
    metal_type: "gold",
    karat: "22k",
    gross_weight: "",
    net_weight: "",
    stone_type: "",
    stone_weight: "",
    making_charges: "",
    purchase_price: "",
    quantity: "",
    min_stock_alert: "2",
    status: "active"
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const { data: metalRatesData } = useMetalRates();
  const rates = metalRatesData?.rates;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category_id: categories.length > 0 ? categories[0].id : "",
      metal_type: "gold",
      karat: "22k",
      gross_weight: "",
      net_weight: "",
      stone_type: "",
      stone_weight: "",
      making_charges: "",
      purchase_price: "",
      quantity: "",
      min_stock_alert: "2",
      status: "active"
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const mc = parseFloat(formData.making_charges) || 0;
      if (mc < 0) {
        throw new Error('Making cost cannot be negative');
      }
      await createProduct({
        ...formData,
        gross_weight: parseFloat(formData.gross_weight) || 0,
        net_weight: parseFloat(formData.net_weight) || 0,
        stone_weight: parseFloat(formData.stone_weight) || 0,
        making_charges: parseFloat(formData.making_charges) || 0,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        quantity: parseInt(formData.quantity) || 0,
        min_stock_alert: parseInt(formData.min_stock_alert) || 0,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Product added", description: "Product has been successfully added to inventory." });
    } catch (error: any) {
      const msg = error?.message || "";
      if (msg.includes('402') || msg.toLowerCase().includes('upgrade')) {
        toast({ title: "Upgrade Required", description: "You need an active plan to add more products. Go to Settings → Subscription.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    }
  };

  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category_id: product.category_id,
      metal_type: product.metal_type,
      karat: product.karat,
      gross_weight: (product.gross_weight ?? "").toString(),
      net_weight: (product.net_weight ?? "").toString(),
      stone_type: product.stone_type ?? "",
      stone_weight: (product.stone_weight ?? "").toString(),
      making_charges: (product.making_charges ?? "").toString(),
      purchase_price: (product.purchase_price ?? "").toString(),
      quantity: (product.quantity ?? "").toString(),
      min_stock_alert: (product.min_stock_alert ?? "").toString(),
      status: product.status
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const mc = parseFloat(formData.making_charges) || 0;
      if (mc < 0) {
        throw new Error('Making cost cannot be negative');
      }
      await updateProduct(editingProduct.id, {
        ...formData,
        gross_weight: parseFloat(formData.gross_weight) || 0,
        net_weight: parseFloat(formData.net_weight) || 0,
        stone_weight: parseFloat(formData.stone_weight) || 0,
        making_charges: parseFloat(formData.making_charges) || 0,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        quantity: parseInt(formData.quantity) || 0,
        min_stock_alert: parseInt(formData.min_stock_alert) || 0,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditDialogOpen(false);
      toast({ title: "Product updated", description: "Product has been successfully updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toast({ title: "Product deleted", description: "Product has been removed from inventory." });
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    }
  };

  const handleExport = () => {
    const headers = ["Name", "SKU", "Category", "Metal", "Karat", "Weight (g)", "Qty", "Price", "Status"];
    const csvData = filtered.map(p => [
      p.name,
      p.sku,
      getCategoryName(categories, p.category_id),
      p.metal_type,
      p.karat,
      p.net_weight,
      p.quantity,
      calculateProductPrice(p, rates),
      p.status
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loadingProducts || loadingCategories) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = products.filter((p: any) => {
    const matchSearch = (p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())) ?? false;
    const matchMetal = metalFilter === 'all' || p.metal_type === metalFilter;
    return matchSearch && matchMetal;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} products · {
              formatCurrency(products.reduce((s: number, p: any) => s + calculateProductPrice(p, rates) * (p.quantity || 0), 0))
            } total value
          </p>
        </div>
        <div className="flex gap-2">
          {isManagerOrOwner && (
            <>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />Export
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-gold-dark" onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />Add Item
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={metalFilter} onValueChange={setMetalFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-3.5 w-3.5" />
            <SelectValue placeholder="Metal Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Metals</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="platinum">Platinum</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border rounded-md">
          <button
            onClick={() => setView('table')}
            className={`p-2 ${view === 'table' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('grid')}
            className={`p-2 ${view === 'grid' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Metal / Karat</TableHead>
                <TableHead className="text-right">Weight (g)</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                {isManagerOrOwner && <TableHead className="w-10"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/50 group">
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.sku}</TableCell>
                  <TableCell className="text-sm">{p.category_id ? getCategoryName(categories, p.category_id) : "No Category"}</TableCell>
                  <TableCell className="text-sm capitalize">{p.metal_type} · {p.karat}</TableCell>
                  <TableCell className="text-right text-sm">{p.net_weight}</TableCell>
                  <TableCell className="text-center">
                    <span className={p.quantity <= p.min_stock_alert ? "text-destructive font-bold" : ""}>
                      {p.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(calculateProductPrice(p, rates))}
                  </TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  {isManagerOrOwner && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(p)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(p.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow relative group">
              {isManagerOrOwner && (
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(p)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(p.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-muted">
                <span className="text-3xl">💎</span>
              </div>
              <h3 className="font-medium text-sm">{p.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">
                  {p.category_id ? getCategoryName(categories, p.category_id) : "No Category"} · {p.metal_type} · {p.karat} · {p.net_weight}g
                </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-bold text-primary">
                  {formatCurrency(calculateProductPrice(p, rates))}
                </span>
                <span className={`text-xs ${p.quantity <= p.min_stock_alert ? "text-destructive" : "text-muted-foreground"}`}>
                  Qty: {p.quantity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              Enter the product details below. All weight measurements are in grams.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={isEditDialogOpen ? handleEditSubmit : handleAddSubmit}>
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU / Code</Label>
                <Input id="sku" value={formData.sku} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select value={formData.category_id} onValueChange={(v) => handleSelectChange('category_id', v)}>
                  <SelectTrigger id="category_id">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metal_type">Metal Type</Label>
                <Select value={formData.metal_type} onValueChange={(v) => handleSelectChange('metal_type', v)}>
                  <SelectTrigger id="metal_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="karat">Karat / Purity</Label>
                <Input id="karat" value={formData.karat} onChange={handleInputChange} placeholder="e.g. 22k, 18k, 925" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="net_weight">Net Weight (g)</Label>
                <Input id="net_weight" type="number" step="0.001" value={formData.net_weight} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="making_charges">Making Cost (₹)</Label>
                <Input
                  id="making_charges"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.making_charges}
                  onChange={handleInputChange}
                  placeholder="e.g. 1500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stone_type">Stone Type</Label>
                <Input id="stone_type" value={formData.stone_type} onChange={handleInputChange} placeholder="e.g. Diamond, Ruby" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Stock Quantity</Label>
                <Input id="quantity" type="number" value={formData.quantity} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock_alert">Min Stock Alert</Label>
                <Input id="min_stock_alert" type="number" value={formData.min_stock_alert} onChange={handleInputChange} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}>Cancel</Button>
              <Button type="submit" id="submit-product">{isEditDialogOpen ? "Update Product" : "Add Product"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
