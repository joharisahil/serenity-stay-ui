import { Layout as AppLayout } from '@/components/layout/Layout';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RotateCcw, Search, Filter, TrendingUp, TrendingDown, BookOpen } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ledgerAccounts, journalEntries as initialJournalEntries } from './mockData';
import { useToast } from '@/hooks/use-toast';
import type { LedgerAccountType, JournalEntry } from './types/inventory';

const accountTypeStyles: Record<LedgerAccountType, string> = {
  ASSET: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  LIABILITY: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  EQUITY: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  REVENUE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  EXPENSE: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const GeneralLedger = () => {
  const { toast } = useToast();
  const [journalList, setJournalList] = useState<JournalEntry[]>(initialJournalEntries);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [reversalEntry, setReversalEntry] = useState<JournalEntry | null>(null);
  const [drillAccount, setDrillAccount] = useState<string | null>(null);

  const accountsByType = (type: LedgerAccountType) => ledgerAccounts.filter(a => a.type === type);

  const filteredJournals = useMemo(() => {
    return journalList.filter(je => {
      const matchesSearch = search === '' || je.entryNumber.toLowerCase().includes(search.toLowerCase()) || je.narration.toLowerCase().includes(search.toLowerCase()) || je.referenceNumber.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || je.referenceType === typeFilter;
      const matchesAccount = accountFilter === 'all' || je.lines.some(l => l.accountId === accountFilter);
      const matchesFrom = !dateFrom || new Date(je.createdAt) >= new Date(dateFrom);
      const matchesTo = !dateTo || new Date(je.createdAt) <= new Date(dateTo + 'T23:59:59');
      return matchesSearch && matchesType && matchesAccount && matchesFrom && matchesTo;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [journalList, search, typeFilter, accountFilter, dateFrom, dateTo]);

  const handleReversal = () => {
    if (!reversalEntry) return;
    const reversalId = `je-rev-${Date.now()}`;
    const revEntry: JournalEntry = {
      id: reversalId,
      entryNumber: `JE-REV-${Date.now().toString().slice(-6)}`,
      referenceType: 'REVERSAL',
      referenceId: reversalEntry.id,
      referenceNumber: reversalEntry.entryNumber,
      lines: reversalEntry.lines.map((l, i) => ({
        ...l,
        id: `${reversalId}-line-${i}`,
        entryType: l.entryType === 'DEBIT' ? 'CREDIT' : 'DEBIT',
        description: `Reversal of: ${l.description}`,
      })),
      totalDebit: reversalEntry.totalCredit,
      totalCredit: reversalEntry.totalDebit,
      narration: `Reversal of ${reversalEntry.entryNumber} – ${reversalEntry.narration}`,
      createdBy: 'Admin',
      createdAt: new Date().toISOString(),
      isReversed: false,
      reversalOf: reversalEntry.id,
    };
    setJournalList(prev => prev.map(je => je.id === reversalEntry.id ? { ...je, isReversed: true, reversalEntryId: reversalId } : je).concat([revEntry]));
    setReversalEntry(null);
    toast({ title: 'Journal Reversed', description: `Reversal entry ${revEntry.entryNumber} created.` });
  };

  const drilldownEntries = drillAccount ? filteredJournals.filter(je => je.lines.some(l => l.accountId === drillAccount)) : [];
  const drilldownAccount = ledgerAccounts.find(a => a.id === drillAccount);

  // Trial balance summary
  const totalDebits = journalList.reduce((s, je) => s + je.totalDebit, 0);
  const totalCredits = journalList.reduce((s, je) => s + je.totalCredit, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">General Ledger</h1>
          <p className="text-muted-foreground text-sm mt-1">Chart of Accounts, Journal Entries & Account Drilldown</p>
        </div>

        <Tabs defaultValue="chart">
          <TabsList>
            <TabsTrigger value="chart">Chart of Accounts</TabsTrigger>
            <TabsTrigger value="journal">Journal Entries</TabsTrigger>
            <TabsTrigger value="trial">Trial Balance</TabsTrigger>
          </TabsList>

          {/* Chart of Accounts */}
          <TabsContent value="chart" className="space-y-4 mt-4">
            {(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as LedgerAccountType[]).map(type => {
              const accounts = accountsByType(type);
              if (accounts.length === 0) return null;
              const total = accounts.reduce((s, a) => s + a.balance, 0);
              return (
                <Card key={type}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className={accountTypeStyles[type]}>{type}</Badge>
                        <span className="text-muted-foreground text-sm">({accounts.length} accounts)</span>
                      </span>
                      <span className="text-sm font-semibold">₹{total.toLocaleString('en-IN')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-t border-border bg-muted/30">
                          <th className="text-left px-5 py-2 text-xs font-medium text-muted-foreground uppercase">Code</th>
                          <th className="text-left px-5 py-2 text-xs font-medium text-muted-foreground uppercase">Account Name</th>
                          <th className="text-left px-5 py-2 text-xs font-medium text-muted-foreground uppercase">Description</th>
                          <th className="text-right px-5 py-2 text-xs font-medium text-muted-foreground uppercase">Balance</th>
                          <th className="text-center px-5 py-2 text-xs font-medium text-muted-foreground uppercase">Drilldown</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {accounts.map(acc => (
                          <tr key={acc.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-2.5 font-mono text-xs">{acc.code}</td>
                            <td className="px-5 py-2.5 font-medium">{acc.parentId ? '↳ ' : ''}{acc.name}</td>
                            <td className="px-5 py-2.5 text-muted-foreground">{acc.description}</td>
                            <td className="px-5 py-2.5 text-right font-semibold">₹{acc.balance.toLocaleString('en-IN')}</td>
                            <td className="px-5 py-2.5 text-center">
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDrillAccount(acc.id)}>
                                <BookOpen className="h-3 w-3 mr-1" />View Entries
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Journal Entries */}
          <TabsContent value="journal" className="mt-4 space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by entry#, narration, reference..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" placeholder="From" />
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" placeholder="To" />
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="PURCHASE_INVOICE">Purchase Invoice</SelectItem>
                      <SelectItem value="PAYMENT">Payment</SelectItem>
                      <SelectItem value="CREDIT_NOTE">Credit Note</SelectItem>
                      <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                      <SelectItem value="REVERSAL">Reversal</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={accountFilter} onValueChange={setAccountFilter}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Account" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      {ledgerAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} · {a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {(search || dateFrom || dateTo || typeFilter !== 'all' || accountFilter !== 'all') && (
                    <Button variant="outline" size="sm" onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setTypeFilter('all'); setAccountFilter('all'); }}>Clear Filters</Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{filteredJournals.length} entries · Total Debit: ₹{filteredJournals.reduce((s, j) => s + j.totalDebit, 0).toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
            <div className="space-y-4">
              {filteredJournals.map(je => (
                <Card key={je.id} className={je.isReversed ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle className="text-sm font-mono">{je.entryNumber}</CardTitle>
                        <Badge variant="outline" className={je.isReversed ? 'bg-destructive/10 text-destructive border-destructive/20' : je.referenceType === 'REVERSAL' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}>
                          {je.isReversed ? 'REVERSED' : je.referenceType.replace('_', ' ')}
                        </Badge>
                        {je.reversalOf && <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/20">Reversal of {je.referenceNumber}</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{new Date(je.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        {!je.isReversed && !je.reversalOf && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setReversalEntry(je)}>
                            <RotateCcw className="h-3 w-3 mr-1" />Reverse
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{je.narration}</p>
                    <p className="text-xs text-muted-foreground">Ref: {je.referenceNumber} · By: {je.createdBy}</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-t border-border bg-muted/30">
                          <th className="text-left px-5 py-2 text-xs font-medium text-muted-foreground uppercase">Account</th>
                          <th className="text-left px-5 py-2 text-xs font-medium text-muted-foreground uppercase">Description</th>
                          <th className="text-right px-5 py-2 text-xs font-medium text-muted-foreground uppercase">Debit (₹)</th>
                          <th className="text-right px-5 py-2 text-xs font-medium text-muted-foreground uppercase">Credit (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {je.lines.map(line => (
                          <tr key={line.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-2 cursor-pointer hover:text-primary" onClick={() => setDrillAccount(line.accountId)}>
                              <span className="font-mono text-xs text-muted-foreground mr-2">{line.accountCode}</span>
                              <span className="font-medium underline-offset-2 hover:underline">{line.accountName}</span>
                            </td>
                            <td className="px-5 py-2 text-muted-foreground">{line.description}</td>
                            <td className="px-5 py-2 text-right font-medium text-info">{line.entryType === 'DEBIT' ? `₹${line.amount.toLocaleString('en-IN')}` : ''}</td>
                            <td className="px-5 py-2 text-right font-medium text-orange-400">{line.entryType === 'CREDIT' ? `₹${line.amount.toLocaleString('en-IN')}` : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-border bg-muted/30 font-bold">
                          <td className="px-5 py-2" colSpan={2}>Total</td>
                          <td className="px-5 py-2 text-right text-info">₹{je.totalDebit.toLocaleString('en-IN')}</td>
                          <td className="px-5 py-2 text-right text-orange-400">₹{je.totalCredit.toLocaleString('en-IN')}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </CardContent>
                </Card>
              ))}
              {filteredJournals.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No journal entries match the current filters.</div>
              )}
            </div>
          </TabsContent>

          {/* Trial Balance */}
          <TabsContent value="trial" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Trial Balance</CardTitle>
                <p className="text-xs text-muted-foreground">Balance of all ledger accounts – Debits must equal Credits for books to balance.</p>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Code</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Account Name</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Type</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Debit</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ledgerAccounts.map(acc => {
                      const isDebitNormal = acc.type === 'ASSET' || acc.type === 'EXPENSE';
                      return (
                        <tr key={acc.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-2.5 font-mono text-xs">{acc.code}</td>
                          <td className="px-5 py-2.5 font-medium">{acc.parentId ? '↳ ' : ''}{acc.name}</td>
                          <td className="px-5 py-2.5"><Badge variant="outline" className={`text-[10px] ${accountTypeStyles[acc.type]}`}>{acc.type}</Badge></td>
                          <td className="px-5 py-2.5 text-right text-info">{isDebitNormal ? `₹${acc.balance.toLocaleString('en-IN')}` : ''}</td>
                          <td className="px-5 py-2.5 text-right text-orange-400">{!isDebitNormal ? `₹${acc.balance.toLocaleString('en-IN')}` : ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/50 font-bold">
                      <td className="px-5 py-3" colSpan={3}>Total</td>
                      <td className="px-5 py-3 text-right text-info">
                        ₹{ledgerAccounts.filter(a => a.type === 'ASSET' || a.type === 'EXPENSE').reduce((s, a) => s + a.balance, 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3 text-right text-orange-400">
                        ₹{ledgerAccounts.filter(a => a.type !== 'ASSET' && a.type !== 'EXPENSE').reduce((s, a) => s + a.balance, 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Journal Reversal Confirmation */}
      <AlertDialog open={!!reversalEntry} onOpenChange={() => setReversalEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverse Journal Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a counter-entry that nullifies <strong>{reversalEntry?.entryNumber}</strong> by swapping all debits and credits.
              The original entry will be marked as REVERSED and cannot be reversed again. This action is permanent and audited.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReversal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <RotateCcw className="h-3.5 w-3.5 mr-2" />Create Reversal Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Account Drilldown Dialog */}
      <AlertDialog open={!!drillAccount} onOpenChange={() => setDrillAccount(null)}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Account Drilldown – {drilldownAccount?.code} · {drilldownAccount?.name}
            </AlertDialogTitle>
            <AlertDialogDescription>All journal entries affecting this account</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 mt-2">
            {drilldownEntries.map(je => (
              <div key={je.id} className="border rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-semibold">{je.entryNumber}</span>
                  <span className="text-xs text-muted-foreground">{new Date(je.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{je.narration}</p>
                {je.lines.filter(l => l.accountId === drillAccount).map(l => (
                  <div key={l.id} className="flex justify-between text-xs">
                    <span>{l.description}</span>
                    <span className={l.entryType === 'DEBIT' ? 'text-info font-semibold' : 'text-orange-400 font-semibold'}>
                      {l.entryType}: ₹{l.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            {drilldownEntries.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">No journal entries found for this account.</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDrillAccount(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default GeneralLedger;
