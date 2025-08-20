"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listAirlines, createAirline, updateAirline, deleteAirline } from "@/lib/api";
import { toast } from "sonner";

export default function AirlinesAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', logoBase64: '' });

  async function load() {
    setLoading(true);
    try {
      const data = await listAirlines({ page: 1, limit: 200, isActive: true });
      setItems(data?.items || []);
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function submit() {
    if (!form.name) { toast.error('Enter name'); return; }
    try {
      await createAirline(form);
      setForm({ name: '', logoBase64: '' });
      load();
      toast.success('Airline added');
    } catch (e) { toast.error(e.message); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Airlines</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-2 items-end">
          <div>
            <label className="text-sm">Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm">Logo</label>
            <Input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return; const r = new FileReader(); r.onload = () => setForm({ ...form, logoBase64: String(r.result || '') }); r.readAsDataURL(f);
            }} />
          </div>
          <div>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={submit}>Add</Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(a => (
                <TableRow key={a._id}>
                  <TableCell>{a.logoUrl ? (<img alt="logo" src={a.logoUrl} className="h-6" />) : '-'}</TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={async () => { await updateAirline(a._id, { isActive: !a.isActive }); load(); }}>Toggle Active</Button>
                    <Button size="sm" variant="outline" className="ml-2" onClick={async () => { await deleteAirline(a._id); load(); }}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">No airlines</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}


