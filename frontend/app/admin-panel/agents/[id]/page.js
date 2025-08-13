"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function AgentDetailPage() {
	const params = useParams();
	const id = params?.id;
	const [agent, setAgent] = useState(null);

	useEffect(() => {
		async function run() {
			if (!id) return;
			const res = await fetch(`${API_BASE}/api/users/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("fd_token") || ""}` } });
			const data = await res.json();
			if (res.ok) setAgent(data?.data || null);
		}
		run();
	}, [id]);

	if (!agent) return <div>Loading...</div>;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{agent.companyName} ({agent.agentId})</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid gap-2">
					<div><strong>Contact:</strong> {agent.contactPersonName} • {agent.contactPersonEmail} • {agent.contactPersonMobile}</div>
					<div><strong>Status:</strong> {agent.isBlocked ? "Blocked" : agent.isActive ? "Active" : "Inactive"}</div>
					<div><strong>Address:</strong> {agent.address}, {agent.city}, {agent.state}, {agent.country} - {agent.pincode}</div>
				</div>
			</CardContent>
		</Card>
	);
} 