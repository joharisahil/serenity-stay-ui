import { Layout as AppLayout } from '@/components/layout/Layout';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Eye, Trash2, CheckCircle, Send, Ban, CreditCard, Lock, Leaf } from 'lucide-react';
import { useState } from 'react';
import { purchaseInvoices as initialInvoices, vendors, inventoryItems } from './mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { PurchaseInvoice, PurchaseInvoiceItem, InvoiceState, PaymentRecord } from './types/inventory';

const statusStyles: Record<string, string> = {
  PAID: 'bg-success/10 text-success border-success/20',
  UNPAID: 'bg-destructive/10 text-destructive border-destructive/20',
  PARTIAL: 'bg-warning/10 text-warning border-warning/20',
};

const stateStyles: Record<InvoiceState, string> = {
  DRAFT: 'bg-muted text-muted-foreground border-border',
  APPROVED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  POSTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-destructive/10 text-destructive border-destructive/20',
};

const PurchaseInvoices = () => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>(initialInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ invoiceId: string; newState: InvoiceState; label: string } | null>(null);
  const { toast } = useToast();

  const [vendorId, setVendorId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<PurchaseInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'UPI'>('BANK_TRANSFER');
  const [paymentRef, setPaymentRef] = useState('');
  const [lineItems, setLineItems] = useState<Array<{ itemId: string; quantity: string; unitPrice: string; gstPercentage: string; batchNumber: string; expiryDate: string }>>([
    { itemId: '', quantity: '', unitPrice: '', gstPercentage: '18', batchNumber: '', expiryDate: '' },
  ]);

  const addLineItem = () => setLineItems(prev => [...prev, { itemId: '', quantity: '', unitPrice: '', gstPercentage: '18', batchNumber: '', expiryDate: '' }]);
  const removeLineItem = (idx: number) => setLineItems(prev => prev.filter((_, i) => i !== idx));
  const updateLineItem = (idx: number, field: string, value: string) =>
    setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, [field]: value } : li));

  const calcSubtotal = () => lineItems.reduce((sum, li) => sum + (parseFloat(li.quantity || '0') * parseFloat(li.unitPrice || '0')), 0);
  const calcGst = () => lineItems.reduce((sum, li) => {
    const base = parseFloat(li.quantity || '0') * parseFloat(li.unitPrice || '0');
    return sum + (base * parseFloat(li.gstPercentage || '0') / 100);
  }, 0);

  const handleCreate = () => {
    if (!vendorId || lineItems.some(li => !li.itemId || !li.quantity || !li.unitPrice)) {
      toast({ title: 'Validation Error', description: 'Please fill vendor and all line item fields.', variant: 'destructive' });
      return;
    }
    const vendor = vendors.find(v => v.id === vendorId);
    const year = new Date().getFullYear();
    const nextNum = (invoices.length + 1).toString().padStart(4, '0');
    const invoiceNumber = `HOTEL-PUR-${year}-${nextNum}`;

    const items: PurchaseInvoiceItem[] = lineItems.map((li, idx) => {
      const item = inventoryItems.find(i => i.id === li.itemId);
      const qty = parseFloat(li.quantity);
      const price = parseFloat(li.unitPrice);
      const gstPct = parseFloat(li.gstPercentage);
      const base = qty * price;
      const gst = base * gstPct / 100;
      return {
        id: `ii-${Date.now()}-${idx}`, itemId: li.itemId, itemName: item?.name || '',
        quantity: qty, unitPrice: price, gstPercentage: gstPct, gstAmount: gst, totalAmount: base + gst,
        isPerishable: item?.isPerishable, batchNumber: item?.isPerishable ? li.batchNumber : undefined,
        expiryDate: item?.isPerishable ? li.expiryDate : undefined,
      };
    });

    const subtotal = calcSubtotal();
    const gstAmount = calcGst();
    const grand = subtotal + gstAmount;
    const newInvoice: PurchaseInvoice = {
      id: `inv-${Date.now()}`, invoiceNumber, vendorId, vendorName: vendor?.name || '', items, subtotal, gstAmount,
      taxBreakdown: { cgst: gstAmount / 2, sgst: gstAmount / 2, igst: 0, totalTax: gstAmount },
      grandTotal: grand, paymentStatus: 'UNPAID', invoiceState: 'DRAFT', paidAmount: 0, outstandingAmount: grand,
      payments: [], notes, createdBy: 'Admin', createdAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0],
    };
    setInvoices(prev => [newInvoice, ...prev]);
    setVendorId(''); setNotes('');
    setLineItems([{ itemId: '', quantity: '', unitPrice: '', gstPercentage: '18', batchNumber: '', expiryDate: '' }]);
    setCreateOpen(false);
    toast({ title: 'Invoice Created', description: `${invoiceNumber} created as Draft.` });
  };

  const handleStateTransition = (invoiceId: string, newState: InvoiceState) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId) return inv;
      const now = new Date().toISOString();
      const updated = { ...inv, invoiceState: newState, updatedAt: now.split('T')[0] };
      if (newState === 'APPROVED') { updated.approvedBy = 'Admin'; updated.approvedAt = now; }
      if (newState === 'POSTED') { updated.postedBy = 'Admin'; updated.postedAt = now; }
      if (newState === 'CANCELLED') { updated.cancelledBy = 'Admin'; updated.cancelledAt = now; updated.cancellationReason = 'Cancelled by admin'; }
      return updated;
    }));
    const msg = newState === 'POSTED' ? 'Invoice posted – stock updated, journal entries created.' : `Invoice state changed to ${newState}.`;
    toast({ title: `Invoice ${newState}`, description: msg });
    setConfirmAction(null);
  };

  const handleRecordPayment = () => {
    if (!paymentInvoice || !paymentAmount || !paymentRef) {
      toast({ title: 'Validation Error', description: 'Please fill all payment fields.', variant: 'destructive' });
      return;
    }
    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > paymentInvoice.outstandingAmount) {
      toast({ title: 'Invalid Amount', description: `Amount must be between ₹1 and ₹${paymentInvoice.outstandingAmount.toLocaleString('en-IN')}.`, variant: 'destructive' });
      return;
    }
    const newPaid = paymentInvoice.paidAmount + amount;
    const newOutstanding = paymentInvoice.grandTotal - newPaid;
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`, invoiceId: paymentInvoice.id, amount, method: paymentMethod,
      reference: paymentRef, paidAt: new Date().toISOString(), recordedBy: 'Admin', journalEntryId: `je-auto-${Date.now()}`,
    };
    setInvoices(prev => prev.map(inv => inv.id !== paymentInvoice.id ? inv : {
      ...inv, paidAmount: newPaid, outstandingAmount: newOutstanding,
      paymentStatus: newOutstanding <= 0 ? 'PAID' : 'PARTIAL',
      payments: [...inv.payments, newPayment], updatedAt: new Date().toISOString().split('T')[0],
    }));
    setPaymentOpen(false); setPaymentAmount(''); setPaymentRef(''); setPaymentInvoice(null);
    toast({ title: 'Payment Recorded', description: `₹${amount.toLocaleString('en-IN')} recorded. Journal entry (AP Dr / Bank Cr) generated.` });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Purchase Invoices</h1>
            <p className="text-muted-foreground text-sm mt-1">DRAFT → APPROVED → POSTED lifecycle with double-entry accounting</p>
          </div>
          <Button className="gold-gradient text-accent-foreground font-medium" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />New Invoice
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoice #</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vendor</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">State</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Grand Total</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Paid</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                      <td className="px-5 py-3 font-medium">{inv.vendorName}</td>
                      <td className="px-5 py-3 text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {inv.invoiceState === 'POSTED' && <Lock className="h-3 w-3 text-muted-foreground" />}
                          <Badge variant="outline" className={stateStyles[inv.invoiceState]}>{inv.invoiceState}</Badge>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">₹{inv.grandTotal.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 text-right text-success">₹{inv.paidAmount.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 text-right text-destructive font-medium">
                        {inv.outstandingAmount > 0 ? `₹${inv.outstandingAmount.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant="outline" className={statusStyles[inv.paymentStatus]}>{inv.paymentStatus}</Badge>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(inv)} title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {inv.invoiceState === 'DRAFT' && (
                            <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ invoiceId: inv.id, newState: 'APPROVED', label: 'Approve' })} title="Approve">
                              <CheckCircle className="h-4 w-4 text-blue-400" />
                            </Button>
                          )}
                          {inv.invoiceState === 'APPROVED' && (
                            <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ invoiceId: inv.id, newState: 'POSTED', label: 'Post' })} title="Post">
                              <Send className="h-4 w-4 text-emerald-400" />
                            </Button>
                          )}
                          {(inv.invoiceState === 'DRAFT' || inv.invoiceState === 'APPROVED') && (
                            <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ invoiceId: inv.id, newState: 'CANCELLED', label: 'Cancel' })} title="Cancel">
                              <Ban className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                          {inv.invoiceState === 'POSTED' && inv.outstandingAmount > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => { setPaymentInvoice(inv); setPaymentOpen(true); }} title="Record Payment">
                              <CreditCard className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal for State Transitions */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.newState === 'POSTED' && 'Post Invoice?'}
              {confirmAction?.newState === 'APPROVED' && 'Approve Invoice?'}
              {confirmAction?.newState === 'CANCELLED' && 'Cancel Invoice?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.newState === 'POSTED' && 'This will lock the invoice permanently. Stock levels will be updated and journal entries (Inventory Dr, Input GST Dr, AP Cr) will be created automatically. This action cannot be undone.'}
              {confirmAction?.newState === 'APPROVED' && 'This will approve the invoice and allow it to be posted. Make sure all details are correct before approving.'}
              {confirmAction?.newState === 'CANCELLED' && 'This will cancel the invoice. No stock or ledger changes will occur. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && handleStateTransition(confirmAction.invoiceId, confirmAction.newState)}
              className={confirmAction?.newState === 'CANCELLED' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : confirmAction?.newState === 'POSTED' ? 'gold-gradient text-accent-foreground' : ''}
            >
              {confirmAction?.newState === 'POSTED' && <><Send className="h-3.5 w-3.5 mr-1.5" />Post & Lock Invoice</>}
              {confirmAction?.newState === 'APPROVED' && <><CheckCircle className="h-3.5 w-3.5 mr-1.5" />Approve Invoice</>}
              {confirmAction?.newState === 'CANCELLED' && <><Ban className="h-3.5 w-3.5 mr-1.5" />Cancel Invoice</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Invoice Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 flex-wrap">
              <DialogTitle className="font-mono">{selectedInvoice?.invoiceNumber}</DialogTitle>
              {selectedInvoice && <Badge variant="outline" className={stateStyles[selectedInvoice.invoiceState]}>{selectedInvoice.invoiceState}</Badge>}
              {selectedInvoice?.invoiceState === 'POSTED' && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Vendor</p><p className="font-medium">{selectedInvoice.vendorName}</p></div>
                <div><p className="text-muted-foreground">Date</p><p className="font-medium">{new Date(selectedInvoice.createdAt).toLocaleDateString('en-IN')}</p></div>
                {selectedInvoice.approvedBy && <div><p className="text-muted-foreground">Approved By</p><p className="font-medium">{selectedInvoice.approvedBy} · {new Date(selectedInvoice.approvedAt!).toLocaleDateString('en-IN')}</p></div>}
                {selectedInvoice.postedBy && <div><p className="text-muted-foreground">Posted By</p><p className="font-medium">{selectedInvoice.postedBy} · {new Date(selectedInvoice.postedAt!).toLocaleDateString('en-IN')}</p></div>}
              </div>
              {selectedInvoice.invoiceState === 'POSTED' && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400 flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  This invoice is locked (POSTED). Modifications require a credit note or reversal entry to maintain audit integrity.
                </div>
              )}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b">
                      <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Item</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Batch / Expiry</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Qty</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Unit Price</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">GST %</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedInvoice.items.map(li => (
                      <tr key={li.id}>
                        <td className="px-4 py-2">
                          <span>{li.itemName}</span>
                          {li.isPerishable && <Leaf className="inline ml-1.5 h-3 w-3 text-emerald-400" />}
                        </td>
                        <td className="px-4 py-2 text-xs font-mono text-muted-foreground">
                          {li.batchNumber ? (
                            <div>
                              <p>{li.batchNumber}</p>
                              {li.expiryDate && <p className="text-[10px]">Exp: {new Date(li.expiryDate).toLocaleDateString('en-IN')}</p>}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-2 text-right">{li.quantity}</td>
                        <td className="px-4 py-2 text-right">₹{li.unitPrice.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-2 text-right">{li.gstPercentage}%</td>
                        <td className="px-4 py-2 text-right font-medium">₹{li.totalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <div className="w-72 space-y-1 text-sm border rounded-lg p-3 bg-muted/30">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{selectedInvoice.subtotal.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">CGST</span><span>₹{selectedInvoice.taxBreakdown.cgst.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">SGST</span><span>₹{selectedInvoice.taxBreakdown.sgst.toLocaleString('en-IN')}</span></div>
                  {selectedInvoice.taxBreakdown.igst > 0 && <div className="flex justify-between"><span className="text-muted-foreground">IGST</span><span>₹{selectedInvoice.taxBreakdown.igst.toLocaleString('en-IN')}</span></div>}
                  <div className="flex justify-between font-bold border-t pt-1"><span>Grand Total</span><span>₹{selectedInvoice.grandTotal.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between border-t pt-1"><span className="text-muted-foreground">Paid</span><span className="text-success">₹{selectedInvoice.paidAmount.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between font-bold"><span>Outstanding</span><span className="text-destructive">₹{selectedInvoice.outstandingAmount.toLocaleString('en-IN')}</span></div>
                </div>
              </div>
              {selectedInvoice.payments.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Payment History (Accounts Payable Dr → Bank Cr)</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-muted/30 border-b">
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Date</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Method</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Reference</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Amount</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Journal Ref</th>
                      </tr></thead>
                      <tbody className="divide-y">
                        {selectedInvoice.payments.map(p => (
                          <tr key={p.id}>
                            <td className="px-4 py-2 text-xs">{new Date(p.paidAt).toLocaleDateString('en-IN')}</td>
                            <td className="px-4 py-2"><Badge variant="outline" className="text-[10px]">{p.method.replace('_', ' ')}</Badge></td>
                            <td className="px-4 py-2 font-mono text-xs">{p.reference}</td>
                            <td className="px-4 py-2 text-right font-medium">₹{p.amount.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{p.journalEntryId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor *</Label>
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>
                    {vendors.filter(v => v.isActive).map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice # (Auto-generated)</Label>
                <Input value={`HOTEL-PUR-${new Date().getFullYear()}-${(invoices.length + 1).toString().padStart(4, '0')}`} disabled className="font-mono" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Line Items</Label>
                <Button variant="outline" size="sm" onClick={addLineItem}><Plus className="h-3 w-3 mr-1" /> Add Item</Button>
              </div>
              <div className="space-y-3">
                {lineItems.map((li, idx) => {
                  const selectedItem = inventoryItems.find(i => i.id === li.itemId);
                  return (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-[1fr_80px_100px_80px_32px] gap-2 items-end">
                        <div>
                          {idx === 0 && <Label className="text-xs text-muted-foreground">Item</Label>}
                          <Select value={li.itemId} onValueChange={v => {
                            const item = inventoryItems.find(i => i.id === v);
                            updateLineItem(idx, 'itemId', v);
                            if (item) updateLineItem(idx, 'unitPrice', item.costPrice.toString());
                          }}>
                            <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                            <SelectContent>
                              {inventoryItems.filter(i => i.isActive).map(i => (
                                <SelectItem key={i.id} value={i.id}>
                                  {i.name} ({i.sku}) {i.isPerishable ? '🌿' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          {idx === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                          <Input type="number" value={li.quantity} onChange={e => updateLineItem(idx, 'quantity', e.target.value)} placeholder="0" />
                        </div>
                        <div>
                          {idx === 0 && <Label className="text-xs text-muted-foreground">Unit Price</Label>}
                          <Input type="number" value={li.unitPrice} onChange={e => updateLineItem(idx, 'unitPrice', e.target.value)} placeholder="0" />
                        </div>
                        <div>
                          {idx === 0 && <Label className="text-xs text-muted-foreground">GST %</Label>}
                          <Input type="number" value={li.gstPercentage} onChange={e => updateLineItem(idx, 'gstPercentage', e.target.value)} placeholder="18" />
                        </div>
                        <div>
                          {lineItems.length > 1 && (
                            <Button variant="ghost" size="sm" onClick={() => removeLineItem(idx)} className="h-9 w-9 p-0">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {selectedItem?.isPerishable && (
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed">
                          <div className="space-y-1">
                            <Label className="text-xs text-emerald-400 flex items-center gap-1"><Leaf className="h-3 w-3" />Batch Number *</Label>
                            <Input value={li.batchNumber} onChange={e => updateLineItem(idx, 'batchNumber', e.target.value)} placeholder="e.g. CC-2025-003" className="font-mono h-8 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-emerald-400 flex items-center gap-1"><Leaf className="h-3 w-3" />Expiry Date *</Label>
                            <Input type="date" value={li.expiryDate} onChange={e => updateLineItem(idx, 'expiryDate', e.target.value)} className="h-8 text-xs" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm border rounded-lg p-3 bg-muted/30">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{calcSubtotal().toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span>₹{calcGst().toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-bold border-t pt-1"><span>Grand Total</span><span>₹{(calcSubtotal() + calcGst()).toLocaleString('en-IN')}</span></div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="gold-gradient text-accent-foreground">Create Invoice (Draft)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {paymentInvoice && (
            <div className="space-y-4">
              <div className="text-sm space-y-1 p-3 border rounded-lg bg-muted/30">
                <div className="flex justify-between"><span className="text-muted-foreground">Invoice</span><span className="font-mono">{paymentInvoice.invoiceNumber}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Grand Total</span><span>₹{paymentInvoice.grandTotal.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Already Paid</span><span>₹{paymentInvoice.paidAmount.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-bold border-t pt-1"><span>Outstanding</span><span className="text-destructive">₹{paymentInvoice.outstandingAmount.toLocaleString('en-IN')}</span></div>
              </div>
              <p className="text-xs text-muted-foreground">Journal: Accounts Payable (Dr) → Cash / Bank (Cr)</p>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder={`Max ₹${paymentInvoice.outstandingAmount.toLocaleString('en-IN')}`} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as typeof paymentMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference # *</Label>
                <Input value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="NEFT/UTR/Cheque/UPI reference" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} className="gold-gradient text-accent-foreground">Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default PurchaseInvoices;
