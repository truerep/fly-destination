"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function AgentPanel() {
	function handleLogout() {
		localStorage.removeItem("fd_role");
		localStorage.removeItem("fd_token");
		localStorage.removeItem("fd_user");
		window.location.reload();
	}

	return (
		<div className="container mx-auto px-4 py-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Agent Dashboard</h1>
				<Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
					<LogOut className="size-4" />
					Logout
				</Button>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Welcome, Agent</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">Your dashboard will appear here.</p>
				</CardContent>
			</Card>
		</div>
	);
} 