"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function AgentDetailPage() {
	const params = useParams();
	const id = params?.id;
	const [agent, setAgent] = useState(null);
	const [transactions, setTransactions] = useState([]);
	const [adjust, setAdjust] = useState({ totalCreditLimitDelta: "", availableCreditLimitDelta: "", balanceDueDelta: "", note: "" });

	useEffect(() => {
		async function run() {
			if (!id) return;
			const res = await fetch(`${API_BASE}/api/users/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("fd_token") || ""}` } });
			const data = await res.json();
			if (res.ok) setAgent((data?.data?.user || data?.data) ?? data?.data);
			const trRes = await fetch(`${API_BASE}/api/finance/admin/transactions?agentId=${id}&page=1&limit=50`, { headers: { Authorization: `Bearer ${localStorage.getItem("fd_token") || ""}` } });
			const tr = await trRes.json();
			if (trRes.ok) setTransactions(tr?.data?.items || []);
		}
		run();
	}, [id]);

	if (!agent) return <div>Loading...</div>;

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>{agent.companyName} ({agent.agentId})</span>
						<div className="flex items-center gap-2">
							{!agent.isApproved && (
								<Button onClick={async () => {
									try {
										const res = await fetch(`${API_BASE}/api/users/${agent._id}/approve`, { method: 'PATCH', headers: { Authorization: `Bearer ${localStorage.getItem('fd_token') || ''}` } });
										if (res.ok) { toast.success('Approved'); location.reload(); }
									} catch {}
								}}>Approve</Button>
							)}
							{!agent.isBlocked ? (
								<Button variant="outline" onClick={async () => {
									try {
										const res = await fetch(`${API_BASE}/api/users/${agent._id}/block`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('fd_token') || ''}` }, body: JSON.stringify({ reason: 'Manual block' }) });
										if (res.ok) { toast.success('Blocked'); location.reload(); }
									} catch {}
								}}>Block</Button>
							) : (
								<Button variant="outline" onClick={async () => {
									try {
										const res = await fetch(`${API_BASE}/api/users/${agent._id}/unblock`, { method: 'PATCH', headers: { Authorization: `Bearer ${localStorage.getItem('fd_token') || ''}` } });
										if (res.ok) { toast.success('Unblocked'); location.reload(); }
									} catch {}
								}}>Unblock</Button>
							)}
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent className="grid md:grid-cols-3 gap-4 text-sm">
					<div>
						<div className="text-muted-foreground">Agent</div>
						<div className="font-medium">{agent.contactPersonName} • {agent.contactPersonEmail} • {agent.contactPersonMobile}</div>
					</div>
					<div>
						<div className="text-muted-foreground">Status</div>
						<div className="font-medium">{agent.isBlocked ? 'Blocked' : agent.isApproved ? 'Approved' : 'Pending'} • {agent.isActive ? 'Active' : 'Inactive'}</div>
					</div>
					<div>
						<div className="text-muted-foreground">Credit (Avail / Total)</div>
						<div className="font-medium">₹ {Number(agent.availableCreditLimit || 0).toLocaleString()} / ₹ {Number(agent.totalCreditLimit || 0).toLocaleString()}</div>
					</div>
					<div className="md:col-span-3">
						<div className="text-muted-foreground">Address</div>
						<div className="font-medium">{agent.address}, {agent.city}, {agent.state}, {agent.country} - {agent.pincode}</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Adjust Credit / Balance Due</CardTitle>
				</CardHeader>
				<CardContent className="grid md:grid-cols-5 gap-2 items-end">
					<Input type="number" placeholder="Total Limit Δ" value={adjust.totalCreditLimitDelta} onChange={(e) => setAdjust({ ...adjust, totalCreditLimitDelta: e.target.value })} />
					<Input type="number" placeholder="Available Δ" value={adjust.availableCreditLimitDelta} onChange={(e) => setAdjust({ ...adjust, availableCreditLimitDelta: e.target.value })} />
					<Input type="number" placeholder="Balance Due Δ" value={adjust.balanceDueDelta} onChange={(e) => setAdjust({ ...adjust, balanceDueDelta: e.target.value })} />
					<Input placeholder="Note (optional)" value={adjust.note} onChange={(e) => setAdjust({ ...adjust, note: e.target.value })} />
					<Button onClick={async () => {
						try {
							const res = await fetch(`${API_BASE}/api/finance/admin/agents/${agent._id}/adjust`, {
								method: 'POST',
								headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('fd_token') || ''}` },
								body: JSON.stringify({
									totalCreditLimitDelta: adjust.totalCreditLimitDelta === '' ? undefined : Number(adjust.totalCreditLimitDelta),
									availableCreditLimitDelta: adjust.availableCreditLimitDelta === '' ? undefined : Number(adjust.availableCreditLimitDelta),
									balanceDueDelta: adjust.balanceDueDelta === '' ? undefined : Number(adjust.balanceDueDelta),
									note: adjust.note || undefined
								})
							});
							if (res.ok) { toast.success('Adjusted'); location.reload(); }
						} catch (e) { toast.error('Failed'); }
					}}>Apply</Button>
					<div className="text-xs text-muted-foreground">Note: Increasing total limit also increases available by the same amount automatically.</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Recent Transactions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>When</TableHead>
									<TableHead>Kind</TableHead>
									<TableHead>Δ</TableHead>
									<TableHead>Before → After</TableHead>
									<TableHead>Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{transactions.map(tr => (
									<TableRow key={tr._id}>
										<TableCell>{new Date(tr.createdAt).toLocaleString()}</TableCell>
										<TableCell>{tr.kind}</TableCell>
										<TableCell>{Number(tr.amount).toLocaleString()}</TableCell>
										<TableCell>{Number(tr.valueBefore).toLocaleString()} → {Number(tr.valueAfter).toLocaleString()}</TableCell>
										<TableCell className="capitalize">{tr.action}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
} 