"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { listAllBookings, processNameChange } from "@/lib/api";
import { toast } from "sonner";

export default function AdminRequestsPage() {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);

	async function load() {
		setLoading(true);
		try {
			const data = await listAllBookings({ page: 1, limit: 100 });
			const bookings = data?.items || data?.bookings || [];
			const pending = bookings.flatMap((b) => (b?.nameChangeRequests || [])
				.filter(r => r.status === 'pending')
				.map(r => ({ booking: b, request: r }))
			);
			setItems(pending);
		} catch (e) {
			toast.error(e.message);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => { load(); }, []);

	async function onApprove(item) {
		const { booking, request } = item;
		const passengers = (request.newPassengers || []).map((p) => ({ firstName: p.firstName, lastName: p.lastName, salutation: p.salutation || 'Mr', type: p.type || 'adult' }));
		try {
			await processNameChange(booking._id, { action: "approve", passengers, requestId: request._id });
			toast.success("Approved name change");
			load();
		} catch (e) { toast.error(e.message); }
	}

	async function onReject(item) {
		const { booking, request } = item;
		try {
			await processNameChange(booking._id, { action: "reject", note: "Rejected by admin", requestId: request._id });
			toast.success("Rejected name change");
			load();
		} catch (e) { toast.error(e.message); }
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Requests</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Reference</TableHead>
								<TableHead>Agent</TableHead>
								<TableHead>Passengers</TableHead>
								<TableHead>Requested At</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((it, idx) => (
								<TableRow key={it.request?._id || idx}>
									<TableCell className="font-mono">{it.booking.reference}</TableCell>
									<TableCell>{it.booking.agent?.companyName || it.booking.agent?.email}</TableCell>
									<TableCell>
										<div className="text-xs">
											<div><strong>Previous:</strong> {(it.request.previousPassengers || []).map((p) => `${p.firstName} ${p.lastName}`).join(", ")}</div>
											<div><strong>New:</strong> {(it.request.newPassengers || []).map((p) => `${p.firstName} ${p.lastName}`).join(", ")}</div>
										</div>
									</TableCell>
									<TableCell>{it.request?.requestedAt ? new Date(it.request.requestedAt).toLocaleString() : "-"}</TableCell>
									<TableCell className="space-x-2">
										<Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onApprove(it)}>Approve</Button>
										<Button size="sm" variant="outline" onClick={() => onReject(it)}>Reject</Button>
									</TableCell>
								</TableRow>
							))}
							{!loading && items.length === 0 && (
								<TableRow>
									<TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No pending requests</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}


