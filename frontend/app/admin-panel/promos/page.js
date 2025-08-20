"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { savePromo, togglePromo, listAllPromosAdmin, deletePromoAdmin } from "@/lib/api";
import { toast } from "sonner";

export default function AdminPromosPage() {
  const [form, setForm] = useState({ agentId: "", code: "", amount: 0, isPercent: false, maxDiscount: "", usageLimit: "", startsAt: "", endsAt: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await listAllPromosAdmin({ page: 1, limit: 100, q });
      setItems(data?.items || []);
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function onSave() {
    if (!form.code) {
      toast.error("Code is required");
      return;
    }
    setSaving(true);
    try {
      await savePromo({
        agentId: form.agentId,
        code: form.code,
        amount: Number(form.amount || 0),
        isPercent: Boolean(form.isPercent),
        maxDiscount: form.maxDiscount !== "" ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit !== "" ? Number(form.usageLimit) : undefined,
        startsAt: form.startsAt || undefined,
        endsAt: form.endsAt || undefined,
        isActive: Boolean(form.isActive),
      });
      toast.success("Promo saved");
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promo Codes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-5">
          <Input placeholder="Agent ID(s) comma-separated (blank = global)" value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })} />
          <Input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          <Input type="number" placeholder="Amount (flat or % based on toggle)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPercent} onChange={(e) => setForm({ ...form, isPercent: e.target.checked })} /> Percent</label>
          <Input type="number" placeholder="Max Discount (cap for % promos)" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
        </div>
        <div className="grid gap-2 md:grid-cols-5">
          <Input type="number" placeholder="Usage Limit (optional)" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
          <div className="text-sm text-muted-foreground flex items-center">Max uses for this agent</div>
          <div className="flex items-center gap-2 text-sm">
            <label>Active <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /></label>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Starts At (optional)</div>
            <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Ends At (optional)</div>
            <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Max Discount caps the rupee discount per booking for percentage promos. Usage Limit controls how many times the agent can use this code.
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700" disabled={saving} onClick={onSave}>{saving ? "Saving..." : "Save Promo"}</Button>

        <div className="flex items-center gap-2 mt-6">
          <Input placeholder="Search code" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <Button variant="outline" onClick={load}>Search</Button>
        </div>

        <div className="rounded-md border mt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-mono">{p.code}</TableCell>
                  <TableCell>{p.isGlobal ? 'All Agents' : (p.agent?.agentId || p.agent)}</TableCell>
                  <TableCell>{p.isPercent ? '%' : 'Flat'}</TableCell>
                  <TableCell>{Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell>{p.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={async () => { try { await deletePromoAdmin(p._id); toast.success('Deleted'); load(); } catch (e) { toast.error(e.message); }}}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No promos</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}


