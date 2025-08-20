"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function AgentsPage() {
	const [agents, setAgents] = useState([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);
	const [limit, setLimit] = useState(10);
	const [pendingOnly, setPendingOnly] = useState(false);

	async function fetchAgents() {
		setLoading(true);
		try {
			const url = new URL(`${API_BASE}/api/users`);
			url.searchParams.set("page", String(page));
			url.searchParams.set("limit", String(limit));
			url.searchParams.set("userType", "agent");
			if (pendingOnly) url.searchParams.set("isApproved", "false");
			if (search) url.searchParams.set("search", search);
			const res = await fetch(url.toString(), {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("fd_token") || ""}`,
				},
			});
			const data = await res.json();
			if (res.ok && data?.data) {
				const items = data.data.items || data.data.users || [];
				setAgents(items);
				setTotal(data.data.total || data.data.pagination?.total || items.length);
			} else {
				console.error(data);
			}
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchAgents();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, limit]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Agents</span>
					<Link href="/admin-panel/agents/create" className="text-sm text-orange-600">Create Agent</Link>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-center gap-2 mb-4">
					<Input placeholder="Search email / phone / company / agent ID" value={search} onChange={(e) => setSearch(e.target.value)} />
					<Button className="bg-orange-600 hover:bg-orange-700" onClick={() => { setPage(1); fetchAgents(); }}>Search</Button>
					<label className="flex items-center gap-2 text-sm">
						<input type="checkbox" checked={pendingOnly} onChange={(e) => { setPendingOnly(e.target.checked); setPage(1); }} />
						<span>Account pending for approval</span>
					</label>
				</div>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Agent ID</TableHead>
								<TableHead>Company</TableHead>
								<TableHead>Contact</TableHead>
								<TableHead>Payment Due</TableHead>
								<TableHead>Credit (Avail / Total)</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{agents.map((a, idx) => (
								<TableRow key={a._id || idx}>
									<TableCell>{a.agentId}</TableCell>
									<TableCell>{a.companyName}</TableCell>
									<TableCell>
										<div className="flex flex-col">
											<span>{a.contactPersonName}</span>
											<span className="text-xs text-muted-foreground">{a.email} • {a.phoneNumber}</span>
										</div>
									</TableCell>
									<TableCell className={`${a?.balanceDue <= 0 ? 'text-green-700' : 'text-red-700'}`}>{a.balanceDue}</TableCell>
									<TableCell>₹ {Number(a.availableCreditLimit || 0).toLocaleString()} / ₹ {Number(a.totalCreditLimit || 0).toLocaleString()}</TableCell>
									<TableCell>{a.isBlocked ? "Blocked" : a.userType === 'agent' && !a.isApproved ? "Pending Approval" : a.isActive ? "Active" : "Inactive"}</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Link className="text-orange-600 text-sm" href={`/admin-panel/agents/${a._id}`}>View</Link>
											{a.userType === 'agent' && !a.isApproved && (
												<button
													className="text-green-600 text-sm"
													onClick={async () => {
														try {
															const res = await fetch(`${API_BASE}/api/users/${a._id}/approve`, { method: 'PATCH', headers: { Authorization: `Bearer ${localStorage.getItem('fd_token') || ''}` } });
															if (res.ok) fetchAgents();
														} catch {}
													}}
												>
													Approve
												</button>
											)}
										</div>
									</TableCell>
								</TableRow>
							))}
							{!loading && agents.length === 0 && (
								<TableRow>
									<TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No agents found</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex items-center gap-2 justify-end mt-4">
					<Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
					<div className="text-sm">Page {page}</div>
					<Button variant="outline" disabled={agents.length < limit} onClick={() => setPage((p) => p + 1)}>Next</Button>
				</div>
			</CardContent>
		</Card>
	);
} 