"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

const AdminPanel = dynamic(() => import("@/panels/admin-panel"), { ssr: false });
const AgentPanel = dynamic(() => import("@/panels/agent-panel"), { ssr: false });

export default function HomeGate() {
	const [role, setRole] = useState(null);
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState({
		identifier: "",
		password: ""
	});

	useEffect(() => {
		setRole(localStorage.getItem("fd_role"));
	}, []);

	async function handleLogin() {
		if (!form.identifier || !form.password) {
			toast.error("Please fill in all fields");
			return;
		}

		setLoading(true);
		try {
			const res = await fetch(`${API_BASE}/api/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			const data = await res.json();
			
            if (res.ok && data?.success) {
				const userType = data.data.user.userType;
				localStorage.setItem("fd_role", userType);
				localStorage.setItem("fd_token", data.data.token);
				localStorage.setItem("fd_user", JSON.stringify(data.data.user));
				toast.success(data.message || "Login successful");
				setRole(userType);
			} else {
              // Show pending approval message distinctly
              if (data?.message && data.message.toLowerCase().includes('pending')) {
                toast.info(data.message);
              } else {
                toast.error(data?.message || "Login failed");
              }
			}
		} catch (error) {
			toast.error("Login failed");
		} finally {
			setLoading(false);
		}
	}

	if (role === "admin") return <AdminPanel />;
	if (role === "agent") return <AgentPanel />;

	return (
		<div className="flex justify-center">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Agent Login</CardTitle>
					<CardDescription>Use email, phone or Agent ID for agents, email for admin</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="identifier">Email / Phone / Agent ID</Label>
						<Input 
							id="identifier" 
							placeholder="agent@example.com or +91.. or FD1234 or admin@flydestination.com"
							value={form.identifier}
							onChange={(e) => setForm(prev => ({ ...prev, identifier: e.target.value }))}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input 
							id="password" 
							type="password" 
							placeholder="••••••••"
							value={form.password}
							onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Button 
							className="bg-orange-600 hover:bg-orange-700 w-full" 
							onClick={handleLogin}
							disabled={loading}
						>
							{loading ? "Logging in..." : "Login"}
						</Button>
					</div>
					<div className="text-center space-y-2">
						<Link href="/agent-panel/register" className="text-orange-600 text-sm block">New Agent? Register</Link>
						<Link href="/forgot-password" className="text-orange-600 text-sm block">Forgot Password?</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
} 