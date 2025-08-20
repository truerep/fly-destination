"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listMyBookings } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

export default function MyBookingsPage() {
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [q, setQ] = useState("");

	async function load() {
		setLoading(true);
		try {
			const data = await listMyBookings({ page, limit, q });
			setBookings(data?.items || data?.bookings || []);
		} catch (e) {
			toast.error(e.message);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

	async function onRequestNameChange(b) {}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>My Bookings</span>
					<div className="flex items-center gap-2">
						<Input placeholder="Search reference/PNR" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
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
								<TableHead>PNR</TableHead>
								<TableHead>Route</TableHead>
								<TableHead>Qty</TableHead>
								<TableHead>Base Price</TableHead>
								<TableHead>Markup</TableHead>
								<TableHead>Sell Price</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{bookings.map((b) => (
								<TableRow key={b._id}>
									<TableCell className="font-mono">{b.reference}</TableCell>
									<TableCell className="font-mono">{b.pnr || b.ticket?.pnr || '-'}</TableCell>
									<TableCell>{b.fromAirportCity || b.ticket?.fromAirport} → {b.toAirportCity || b.ticket?.toAirport}</TableCell>
									<TableCell>{b.quantity}</TableCell>
									<TableCell>₹ {Number(b.totalBasePrice || 0).toLocaleString()}</TableCell>
									<TableCell>₹ {Number(b.totalMarkup || 0).toLocaleString()}</TableCell>
									<TableCell>₹ {Number(b.totalSellingPrice || 0).toLocaleString()}</TableCell>
									<TableCell>{b.status}</TableCell>
									<TableCell className="space-x-2">
										<Link href={`/agent-panel/bookings/${b._id}/print`} className="inline-block">
											<Button size="sm" variant="outline">Print Ticket</Button>
										</Link>
										<Link href={`/agent-panel/bookings/${b._id}/request-name-change`} className="inline-block">
											<Button size="sm" variant="outline">Request Name Change</Button>
										</Link>
									</TableCell>
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


