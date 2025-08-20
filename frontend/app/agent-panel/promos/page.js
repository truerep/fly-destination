"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listMyPromos } from "@/lib/api";
import { toast } from "sonner";

export default function AgentPromosPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await listMyPromos();
      setItems(data?.items || []);
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Promo Codes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Max</TableHead>
                <TableHead>Usage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(p => (
                <TableRow key={p._id}>
                  <TableCell className="font-mono">{p.code}</TableCell>
                  <TableCell>{p.amount}</TableCell>
                  <TableCell>{p.isPercent ? 'Percent' : 'Flat'}</TableCell>
                  <TableCell>{p.maxDiscount ?? '-'}</TableCell>
                  <TableCell>{p.usageCount}{p.usageLimit ? ` / ${p.usageLimit}` : ''}</TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No promos</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}


