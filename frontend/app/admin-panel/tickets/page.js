"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { listTickets, deleteTicket } from "@/lib/api";
import { toast } from "sonner";

export default function AdminTicketsPage() {
	const [tickets, setTickets] = useState([]);
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [loading, setLoading] = useState(false);
	const [q, setQ] = useState("");

	async function load() {
		setLoading(true);
		try {
			const data = await listTickets({ page, limit, q });
			setTickets(data?.items || data?.tickets || []);
		} catch (e) {
			toast.error(e.message);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

	async function onDelete(id) {
		if (!confirm("Delete this ticket?")) return;
		try {
			await deleteTicket(id);
			toast.success("Ticket deleted");
			load();
		} catch (e) { toast.error(e.message); }
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Tickets</span>
					<div className="flex items-center gap-2">
						<Input placeholder="Search (airline/PNR/route/flight)" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
						<Button variant="outline" onClick={() => { setPage(1); load(); }}>Search</Button>
						<Link href="/admin-panel/tickets/create"><Button className="bg-orange-600 hover:bg-orange-700">Add Ticket</Button></Link>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Route</TableHead>
								<TableHead>Airline</TableHead>
								<TableHead>PNR</TableHead>
								<TableHead>Flight</TableHead>
								<TableHead>Departs</TableHead>
								<TableHead>Base</TableHead>
								<TableHead>Avail/Total</TableHead>
								<TableHead>Booked</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{tickets.map((t) => (
								<TableRow key={t._id}>
									<TableCell>{t.fromAirport} → {t.toAirport}</TableCell>
									<TableCell>{t.airline}</TableCell>
									<TableCell>{t.pnr ?? '-'}</TableCell>
									<TableCell>{t.flightNumber}</TableCell>
									<TableCell>{new Date(t.departureTime).toLocaleString()}</TableCell>
									<TableCell>₹ {Number(t.basePrice).toLocaleString()}</TableCell>
									<TableCell>{t.quantityAvailable}/{t.quantityTotal}</TableCell>
									<TableCell>{t.quantityBooked || '-'}</TableCell>
									<TableCell className="space-x-2">
										<Link href={`/admin-panel/tickets/${t._id}/edit`}><Button size="sm" variant="outline">Edit</Button></Link>
										<Button size="sm" variant="outline" onClick={() => onDelete(t._id)}>Delete</Button>
									</TableCell>
								</TableRow>
							))}
							{!loading && tickets.length === 0 && (
								<TableRow>
									<TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No tickets</TableCell>
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


