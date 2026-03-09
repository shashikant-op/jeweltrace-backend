import { cn } from "@/lib/utils";

type StatusType = 'paid' | 'partial' | 'unpaid' | 'received' | 'in_progress' | 'ready' | 'delivered' | 'active' | 'inactive';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-success/10 text-success border-success/20' },
  partial: { label: 'Partial', className: 'bg-primary/10 text-primary border-primary/20' },
  unpaid: { label: 'Unpaid', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  received: { label: 'Received', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_progress: { label: 'In Progress', className: 'bg-primary/10 text-primary border-primary/20' },
  ready: { label: 'Ready', className: 'bg-success/10 text-success border-success/20' },
  delivered: { label: 'Delivered', className: 'bg-muted text-muted-foreground border-border' },
  active: { label: 'Active', className: 'bg-success/10 text-success border-success/20' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground border-border' },
};

export function StatusBadge({ status }: { status: StatusType }) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}
