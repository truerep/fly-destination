"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listAllBookings } from "@/lib/api";
import { toast } from "sonner";

export default function AdminBookingsPage() {
	const [bookings, setBookings] = useState([]);
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [loading, setLoading] = useState(false);
	const [q, setQ] = useState("");

	async function load() {
		setLoading(true);
		try {
			const data = await listAllBookings({ page, limit, q });
			setBookings(data?.items || data?.bookings || []);
		} catch (e) {
			toast.error(e.message);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>All Bookings</span>
					<div className="flex items-center gap-2">
						<Input placeholder="Search reference/PNR/partner" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
						<Button variant="outline" onClick={() => { setPage(1); load(); }}>Search</Button>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Reference</TableHead>
								<TableHead>Agent</TableHead>
								<TableHead>PNR</TableHead>
								<TableHead>Route</TableHead>
								<TableHead>Qty</TableHead>
								<TableHead>Total Sell</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{bookings.map((b) => (
								<TableRow key={b._id}>
									<TableCell className="font-mono">{b.reference}</TableCell>
									<TableCell>{b.agent?.companyName || b.agent?.email}</TableCell>
									<TableCell className="font-mono">{b.pnr || b.ticket?.pnr || '-'}</TableCell>
									<TableCell>{b.fromAirportCity || b.ticket?.fromAirport} → {b.toAirportCity || b.ticket?.toAirport}</TableCell>
									<TableCell>{b.quantity}</TableCell>
									<TableCell>₹ {Number(b.totalSellingPrice || 0).toLocaleString()}</TableCell>
									<TableCell>{b.status}</TableCell>
								</TableRow>
							))}
							{!loading && bookings.length === 0 && (
								<TableRow>
									<TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No bookings</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex items-center gap-2 justify-end mt-4">
					<Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
					<div className="text-sm">Page {page}</div>
					<Button variant="outline" onClick={() => setPage((p) => p + 1)}>Next</Button>
				</div>
			</CardContent>
		</Card>
	);
}


