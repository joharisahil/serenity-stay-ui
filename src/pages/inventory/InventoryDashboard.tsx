import { Layout as AppLayout } from '@/components/layout/Layout';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package, AlertTriangle, DollarSign, FileText, Users, TrendingDown,
  ArrowUpRight, ArrowDownRight, Clock, Leaf, IndianRupee,
} from 'lucide-react';
import {
  inventoryItems, stockTransactions, vendors, purchaseInvoices,
  getLowStockItems, getTotalStockValue, getPendingInvoiceCount,
  getExpiringBatches, getTotalOutstanding,
} from './mockData';

const StatCard = ({ title, value, icon: Icon, trend, trendLabel, sub, variant = 'default' }: {
  title: string; value: string; icon: any; trend?: string; trendLabel?: string; sub?: string;
  variant?: 'default' | 'warning' | 'success' | 'danger' | 'info';
}) => {
  const iconClass = variant === 'warning' ? 'bg-warning/10 text-warning' : variant === 'success' ? 'bg-success/10 text-success' : variant === 'danger' ? 'bg-destructive/10 text-destructive' : variant === 'info' ? 'bg-info/10 text-info' : 'bg-accent/10 text-accent';
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            {trend && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
                {trend} {trendLabel}
              </p>
            )}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TransactionTypeBadge = ({ type }: { type: string }) => {
  const styles: Record<string, string> = {
    IN: 'bg-success/10 text-success border-success/20',
    OUT: 'bg-destructive/10 text-destructive border-destructive/20',
    ADJUSTMENT: 'bg-warning/10 text-warning border-warning/20',
  };
  return <Badge variant="outline" className={styles[type] || ''}>{type}</Badge>;
};

const Dashboard = () => {
  const lowStockItems = getLowStockItems();
  const totalValue = getTotalStockValue();
  const pendingCount = getPendingInvoiceCount();
  const expiringBatches = getExpiringBatches(30);
  const totalOutstanding = getTotalOutstanding();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Enterprise overview – stock, finance, and compliance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Total Items" value={inventoryItems.length.toString()} icon={Package} trend="+3" trendLabel="this month" />
          <StatCard title="Low Stock" value={lowStockItems.length.toString()} icon={AlertTriangle} variant="warning" sub="Items below minimum" />
          <StatCard title="Stock Value" value={`₹${(totalValue / 1000).toFixed(1)}K`} icon={DollarSign} variant="success" sub={`₹${totalValue.toLocaleString('en-IN')} total`} />
          <StatCard title="Expiring Soon" value={expiringBatches.length.toString()} icon={Clock} variant={expiringBatches.length > 0 ? 'warning' : 'default'} sub="Within 30 days" />
          <StatCard title="Pending Invoices" value={pendingCount.toString()} icon={FileText} />
          <StatCard title="Total Payable" value={`₹${(totalOutstanding / 1000).toFixed(1)}K`} icon={IndianRupee} variant="danger" sub="Outstanding to vendors" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku} · {item.categoryName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-destructive">{item.currentStock} {item.unit}</p>
                      <p className="text-xs text-muted-foreground">Min: {item.minimumStock}</p>
                    </div>
                  </div>
                ))}
                {lowStockItems.length === 0 && <p className="px-5 py-4 text-sm text-muted-foreground">All items are sufficiently stocked.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Expiring Batches */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />Batches Expiring in 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {expiringBatches.map(batch => {
                  const days = Math.ceil((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={batch.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1">{batch.itemName} <Leaf className="h-3 w-3 text-emerald-400" /></p>
                        <p className="text-xs font-mono text-muted-foreground">{batch.batchNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Qty: {batch.remainingQuantity}</p>
                        <Badge variant="outline" className={`text-[10px] ${days <= 7 ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                          {days}d left
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {expiringBatches.length === 0 && <p className="px-5 py-4 text-sm text-muted-foreground">No batches expiring in the next 30 days.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Stock Movements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-info" />Recent Stock Movements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {stockTransactions.slice(0, 5).map(txn => (
                  <div key={txn.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <TransactionTypeBadge type={txn.type} />
                      <div>
                        <p className="text-sm font-medium">{txn.itemName}</p>
                        <p className="text-xs text-muted-foreground">{txn.referenceType} · {new Date(txn.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${txn.type === 'IN' ? 'text-success' : 'text-destructive'}`}>
                        {txn.type === 'IN' ? '+' : '-'}{Math.abs(txn.quantity)}
                      </p>
                      <p className="text-xs text-muted-foreground">Bal: {txn.balanceAfter}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vendor Payables */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-warning" />Vendor Payables (Posted Invoices)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {purchaseInvoices.filter(i => i.invoiceState === 'POSTED' && i.outstandingAmount > 0).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{inv.vendorName}</p>
                      <p className="text-xs font-mono text-muted-foreground">{inv.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-destructive">₹{inv.outstandingAmount.toLocaleString('en-IN')}</p>
                      <Badge variant="outline" className={`text-[10px] ${inv.paymentStatus === 'UNPAID' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-warning/10 text-warning border-warning/20'}`}>{inv.paymentStatus}</Badge>
                    </div>
                  </div>
                ))}
                {purchaseInvoices.filter(i => i.invoiceState === 'POSTED' && i.outstandingAmount > 0).length === 0 && (
                  <p className="px-5 py-4 text-sm text-muted-foreground">No outstanding payables.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
