"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMyFinance, createFinanceRequest, listMyFinanceTransactions, listMyFinanceRequests } from "@/lib/api";
import { toast } from "sonner";

export default function AgentFinancePage() {
  const [finance, setFinance] = useState(null);
  const [form, setForm] = useState({ type: 'availableCreditLimit', amount: '', paymentReference: '', paymentScreenshotBase64: '', note: '' });
  const [transactions, setTransactions] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const f = await getMyFinance();
      setFinance(f);
      const t = await listMyFinanceTransactions({ page: 1, limit: 50 });
      setTransactions(t?.items || []);
      const r = await listMyFinanceRequests({ page: 1, limit: 50, status: 'pending' });
      setPending(r?.items || []);
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function submit() {
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Enter amount'); return; }
    try {
      const payload = { type: form.type, amount: Number(form.amount) };
      if (form.type === 'balanceDueSettlement') {
        payload.paymentReference = form.paymentReference || undefined;
        payload.paymentScreenshotBase64 = form.paymentScreenshotBase64 || undefined;
        payload.note = form.note || undefined;
      }
      await createFinanceRequest(payload);
      toast.success('Request submitted');
      setForm({ type: 'availableCreditLimit', amount: '', paymentReference: '', paymentScreenshotBase64: '', note: '' });
      load();
    } catch (e) { toast.error(e.message); }
  }

  const availableCredit = Math.max(0, Number(finance?.availableCreditLimit || 0));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Finance</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Total Credit Limit</div>
            <div className="font-medium">₹ {Number(finance?.totalCreditLimit || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Available Credit</div>
            <div className="font-medium">₹ {availableCredit.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Receivable (Total - Available)</div>
            <div className="font-medium">₹ {Number(Math.max(0, Number(finance?.totalCreditLimit || 0) - Number(finance?.availableCreditLimit || 0))).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Balance Due</div>
            <div className="font-medium">₹ {Number(finance?.balanceDue || 0).toLocaleString()}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request Credit Adjust</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-2 items-end">
            <div>
              <label className="text-sm">Type</label>
              <select className="border rounded h-9 w-full px-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="availableCreditLimit">Increase Available Credit</option>
                <option value="totalCreditLimit">Increase Total Credit Limit</option>
                <option value="balanceDueSettlement">Clear Balance Due (Upload Proof)</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Amount</label>
              <Input type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={submit}>Submit</Button>
            </div>
          </div>

          {form.type === 'balanceDueSettlement' && (
            <div className="grid md:grid-cols-3 gap-2 mt-3">
              <div>
                <label className="text-sm">Transaction Number</label>
                <Input value={form.paymentReference} onChange={(e) => setForm({ ...form, paymentReference: e.target.value })} placeholder="UTR/Txn ID" />
              </div>
              <div>
                <label className="text-sm">Payment Screenshot</label>
                <Input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const base64 = reader.result?.toString() || '';
                    setForm(prev => ({ ...prev, paymentScreenshotBase64: base64 }));
                  };
                  reader.readAsDataURL(file);
                }} />
                
              </div>
              <div>
                <label className="text-sm">Note</label>
                <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional message" />
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Pending Requests</div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map(r => (
                    <TableRow key={r._id}>
                      <TableCell>{r.type}</TableCell>
                      <TableCell>₹ {Number(r.amount || 0).toLocaleString()}</TableCell>
                      <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {!loading && pending.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">No pending requests</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Δ</TableHead>
                  <TableHead>Before → After</TableHead>
                  <TableHead>Avail After</TableHead>
                  <TableHead>Total After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(tr => (
                  <TableRow key={tr._id}>
                    <TableCell>{new Date(tr.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{tr.action}</TableCell>
                    <TableCell>{tr.kind}</TableCell>
                    <TableCell>{Number(tr.amount).toLocaleString()}</TableCell>
                    <TableCell>{Number(tr.valueBefore).toLocaleString()} → {Number(tr.valueAfter).toLocaleString()}</TableCell>
                    <TableCell>₹ {Number(tr.availableAfter ?? 0).toLocaleString()}</TableCell>
                    <TableCell>₹ {Number(tr.totalAfter ?? 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {!loading && transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">No transactions</TableCell>
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


