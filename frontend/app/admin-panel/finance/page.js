"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listFinanceRequestsAdmin, processFinanceRequest, getReceivables, adjustAgentFinance, listFinanceTransactionsAdmin } from "@/lib/api";
import { toast } from "sonner";

export default function AdminFinancePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [receivables, setReceivables] = useState([]);
  const [adjust, setAdjust] = useState({ agentId: '', totalCreditLimitDelta: '', availableCreditLimitDelta: '' });
  const [transactions, setTransactions] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const data = await listFinanceRequestsAdmin({ page: 1, limit: 50, q });
      setItems(data?.items || []);
      const r = await getReceivables();
      setReceivables(r?.items || []);
      const t = await listFinanceTransactionsAdmin({ page: 1, limit: 50, q });
      setTransactions(t?.items || []);
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function act(item, action) {
    try {
      await processFinanceRequest(item._id, { action });
      toast.success(`${action}ed`);
      load();
    } catch (e) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Finance Requests</span>
            <div className="flex items-center gap-2">
              <Input placeholder="Search agent" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
              <Button variant="outline" onClick={load}>Search</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-6 gap-2 items-end mb-4">
            <Input placeholder="Agent ID (FD1234)" value={adjust.agentId} onChange={(e) => setAdjust({ ...adjust, agentId: e.target.value.toUpperCase() })} />
            <Input type="number" placeholder="Total Credit Limit Δ" value={adjust.totalCreditLimitDelta} onChange={(e) => setAdjust({ ...adjust, totalCreditLimitDelta: e.target.value })} />
            <Input type="number" placeholder="Available Credit Δ" value={adjust.availableCreditLimitDelta} onChange={(e) => setAdjust({ ...adjust, availableCreditLimitDelta: e.target.value })} />
            <Input type="number" placeholder="Balance Due Δ" value={adjust.balanceDueDelta || ''} onChange={(e) => setAdjust({ ...adjust, balanceDueDelta: e.target.value })} />
            <Input placeholder="Note (optional)" value={adjust.note || ''} onChange={(e) => setAdjust({ ...adjust, note: e.target.value })} />
            <Button onClick={async () => {
              if (!adjust.agentId) { toast.error('Enter agent ID'); return; }
              try {
                await adjustAgentFinance(adjust.agentId, {
                  totalCreditLimitDelta: adjust.totalCreditLimitDelta === '' ? undefined : Number(adjust.totalCreditLimitDelta),
                  availableCreditLimitDelta: adjust.availableCreditLimitDelta === '' ? undefined : Number(adjust.availableCreditLimitDelta),
                  balanceDueDelta: adjust.balanceDueDelta === '' ? undefined : Number(adjust.balanceDueDelta),
                  note: adjust.note || undefined,
                });
                toast.success('Adjusted');
                setAdjust({ agentId: '', totalCreditLimitDelta: '', availableCreditLimitDelta: '', balanceDueDelta: '', note: '' });
                load();
              } catch (e) { toast.error(e.message); }
            }}>Adjust Finance</Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent ID</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it._id}>
                    <TableCell>{it.agent?.agentId}</TableCell>
                    <TableCell>{it.agent?.companyName || it.agent?.email}</TableCell>
                    <TableCell>{it.type}</TableCell>
                    <TableCell>₹ {Number(it.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      {it.paymentScreenshotUrl ? (
                        <a href={it.paymentScreenshotUrl} target="_blank" rel="noreferrer">
                          <img src={it.paymentScreenshotUrl} alt="proof" className="h-12 w-auto rounded border" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                      {it.paymentReference && (
                        <div className="text-xs mt-1">Ref: {it.paymentReference}</div>
                      )}
                    </TableCell>
                    <TableCell>{it.status}</TableCell>
                    <TableCell className="space-x-2">
                      {it.status === 'pending' ? (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => act(it, 'approve')}>Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => act(it, 'reject')}>Reject</Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Processed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No requests</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receivables (per Agent)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent ID</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Total Credit Limit</TableHead>
                  <TableHead>Available Credit</TableHead>
                  <TableHead>Receivable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivables.map(r => (
                  <TableRow key={r.agentId}>
                    <TableCell>{r.agentId}</TableCell>
                    <TableCell>{r.companyName}</TableCell>
                    <TableCell>₹ {Number(r.totalCreditLimit || 0).toLocaleString()}</TableCell>
                    <TableCell>₹ {Number(r.availableCreditLimit || 0).toLocaleString()}</TableCell>
                    <TableCell>₹ {Number(r.receivable || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {!loading && receivables.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">No data</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Finance Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Δ</TableHead>
                  <TableHead>Before → After</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(tr => (
                  <TableRow key={tr._id}>
                    <TableCell>{tr.agent?.agentId}</TableCell>
                    <TableCell>{tr.kind}</TableCell>
                    <TableCell>{Number(tr.amount).toLocaleString()}</TableCell>
                    <TableCell>{Number(tr.valueBefore).toLocaleString()} → {Number(tr.valueAfter).toLocaleString()}</TableCell>
                    <TableCell>{tr.action}</TableCell>
                    <TableCell>{new Date(tr.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {!loading && transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No transactions</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


