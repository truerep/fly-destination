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
			const pending = bookings.filter((b) => b?.nameChangeRequest?.requested && (b?.nameChangeRequest?.status === "pending" || !b?.nameChangeRequest?.status));
			setItems(pending);
		} catch (e) {
			toast.error(e.message);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => { load(); }, []);

	async function onApprove(b) {
		const passengers = (b.passengers || []).map((p) => ({ firstName: p.firstName, lastName: p.lastName, gender: p.gender }));
		try {
			await processNameChange(b._id, { action: "approve", passengers });
			toast.success("Approved name change");
			load();
		} catch (e) { toast.error(e.message); }
	}

	async function onReject(b) {
		try {
			await processNameChange(b._id, { action: "reject", note: "Rejected by admin" });
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
							{items.map((b) => (
								<TableRow key={b._id}>
									<TableCell className="font-mono">{b.reference}</TableCell>
									<TableCell>{b.agent?.companyName || b.agent?.email}</TableCell>
									<TableCell>{(b.passengers || []).map((p) => `${p.firstName} ${p.lastName}`).join(", ")}</TableCell>
									<TableCell>{b?.nameChangeRequest?.requestedAt ? new Date(b.nameChangeRequest.requestedAt).toLocaleString() : "-"}</TableCell>
									<TableCell className="space-x-2">
										<Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onApprove(b)}>Approve</Button>
										<Button size="sm" variant="outline" onClick={() => onReject(b)}>Reject</Button>
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


