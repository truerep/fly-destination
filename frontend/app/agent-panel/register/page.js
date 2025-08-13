"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function AgentRegisterPage() {
	const [form, setForm] = useState({
		userType: "agent",
		email: "",
		password: "",
		phoneNumber: "",
		companyName: "",
		gst: "",
		pan: "",
		panName: "",
		contactPersonName: "",
		contactPersonDesignation: "",
		contactPersonEmail: "",
		contactPersonMobile: "",
		address: "",
		city: "",
		state: "",
		country: "",
		pincode: "",
		remark: "",
	});

	function setField(k, v) { setForm((f) => ({ ...f, [k]: v })); }

	async function onSubmit() {
		try {
			const res = await fetch(`${API_BASE}/api/auth/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			const data = await res.json();
			if (res.ok) {
				toast.success(data?.message || "Registered successfully");
				localStorage.setItem("fd_role", "agent");
				localStorage.setItem("fd_token", data?.data?.token || "");
			} else {
				toast.error(data?.message || "Registration failed");
			}
		} catch (e) {
			toast.error("Registration failed");
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>New Agent Registration</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2 md:col-span-2">
					<Label>Email</Label>
					<Input value={form.email} onChange={(e) => setField("email", e.target.value)} />
				</div>
				<div className="space-y-2">
					<Label>Password</Label>
					<Input type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} />
				</div>
				<div className="space-y-2">
					<Label>Phone</Label>
					<Input value={form.phoneNumber} onChange={(e) => setField("phoneNumber", e.target.value)} />
				</div>
				<div className="space-y-2 md:col-span-2">
					<Label>Company Name</Label>
					<Input value={form.companyName} onChange={(e) => setField("companyName", e.target.value)} />
				</div>
				<div className="space-y-2">
					<Label>GST</Label>
					<Input value={form.gst} onChange={(e) => setField("gst", e.target.value)} />
				</div>
				<div className="space-y-2">
					<Label>PAN</Label>
					<Input value={form.pan} onChange={(e) => setField("pan", e.target.value)} />
				</div>
				<div className="space-y-2 md:col-span-2">
					<Label>PAN Name</Label>
					<Input value={form.panName} onChange={(e) => setField("panName", e.target.value)} />
				</div>
				<div className="space-y-2">
					<Label>Contact Person</Label>
					<Input value={form.contactPersonName} onChange={(e) => setField("contactPersonName", e.target.value)} />
				</div>
				<div className="space-y-2">
					<Label>Designation</Label>
					<Input value={form.contactPersonDesignation} onChange={(e) => setField("contactPersonDesignation", e.target.value)} />
				</div>
				<div className="space-y-2">
					<Label>Contact Email</Label>
					<Input value={form.contactPersonEmail} onChange={(e) => setField("contactPersonEmail", e.target.value)} />
				</div>
				<div className="space-y-2">
					<Label>Contact Mobile</Label>
					<Input value={form.contactPersonMobile} onChange={(e) => setField("contactPersonMobile", e.target.value)} />
				</div>
				<div className="space-y-2 md:col-span-2">
					<Label>Address</Label>
					<Input value={form.address} onChange={(e) => setField("address", e.target.value)} />
				</div>
				<div className="space-y-2">
					<Label>City</Label>
					<Input value={form.city} onChange={(e) => setField("city", e.target.value)} />
				</div>
				<div className="space-y-2">
					<Label>State</Label>
					<Input value={form.state} onChange={(e) => setField("state", e.target.value)} />
				</div>
				<div className="space-y-2">
					<Label>Country</Label>
					<Input value={form.country} onChange={(e) => setField("country", e.target.value)} />
				</div>
				<div className="space-y-2">
					<Label>Pincode</Label>
					<Input value={form.pincode} onChange={(e) => setField("pincode", e.target.value)} />
				</div>
				<div className="space-y-2 md:col-span-2">
					<Label>Remark</Label>
					<Input value={form.remark} onChange={(e) => setField("remark", e.target.value)} />
				</div>
				<div className="md:col-span-2">
					<Button className="bg-orange-600 hover:bg-orange-700" onClick={onSubmit}>Register</Button>
				</div>
			</CardContent>
		</Card>
	);
} 