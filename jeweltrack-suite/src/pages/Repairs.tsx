import { useState } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/data/dummy-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useRepairs, useCustomers, getCustomerName } from "@/lib/api";

const statusColumns = ['received', 'in_progress', 'ready', 'delivered'] as const;
const statusLabels: Record<string, string> = {
  received: 'Received', in_progress: 'In Progress', ready: 'Ready', delivered: 'Delivered'
};

export default function Repairs() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: repairs = [], isLoading: loadingRepairs } = useRepairs();
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();

  if (loadingRepairs || loadingCustomers) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = repairs.filter((r: any) => {
    const matchSearch = r.order_number.toLowerCase().includes(search.toLowerCase()) ||
      getCustomerName(customers, r.customer_id).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Repairs</h1>
          <p className="text-sm text-muted-foreground">{repairs.length} repair orders</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={view} onValueChange={v => setView(v as 'kanban' | 'table')}>
            <TabsList>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-gold-dark">
            <Plus className="mr-2 h-4 w-4" />New Repair
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {view === 'kanban' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statusColumns.map(status => (
            <div key={status} className="rounded-xl border bg-card">
              <div className="border-b p-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{statusLabels[status]}</h3>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {repairs.filter((r: any) => r.status === status).length}
                </span>
              </div>
              <div className="p-3 space-y-3">
                {repairs
                  .filter((r: any) => r.status === status)
                  .filter((r: any) => r.order_number.toLowerCase().includes(search.toLowerCase()) || getCustomerName(customers, r.customer_id).toLowerCase().includes(search.toLowerCase()))
                  .map((r: any) => (
                    <div key={r.id} className="rounded-lg border p-3 hover:shadow-sm transition-shadow cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-primary">{r.order_number}</span>
                      </div>
                      <p className="text-sm font-medium">{r.item_description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{getCustomerName(customers, r.customer_id)}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">Due: {formatDate(r.estimated_date)}</span>
                        <span className="text-xs font-medium">{formatCurrency(r.total_estimate)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Estimate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r: any) => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium text-primary">{r.order_number}</TableCell>
                  <TableCell>{getCustomerName(customers, r.customer_id)}</TableCell>
                  <TableCell className="text-sm">{r.item_description}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(r.estimated_date)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(r.total_estimate)}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
