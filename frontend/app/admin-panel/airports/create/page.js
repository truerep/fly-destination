"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function CreateAirportPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState({
		airportCode: "",
		airportName: "",
		city: "",
		country: "",
		state: "",
		timezone: "UTC",
		latitude: "",
		longitude: "",
		description: "",
		isActive: true,
	});

	function setField(key, value) {
		setForm(prev => ({ ...prev, [key]: value }));
	}

	async function handleSubmit(e) {
		e.preventDefault();
		
		if (!form.airportCode || !form.airportName || !form.city || !form.country) {
			toast.error("Please fill in all required fields");
			return;
		}

		setLoading(true);
		try {
			const res = await fetch(`${API_BASE}/api/airports`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("fd_token") || ""}`,
				},
				body: JSON.stringify(form),
			});
			const data = await res.json();
			
			if (res.ok) {
				toast.success("Airport created successfully");
				router.push("/admin-panel/airports");
			} else {
				toast.error(data?.message || "Failed to create airport");
			}
		} catch (error) {
			toast.error("Failed to create airport");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link href="/admin-panel/airports">
					<Button variant="outline" size="sm">
						<ArrowLeft className="size-4 mr-2" />
						Back to Airports
					</Button>
				</Link>
				<h1 className="text-2xl font-bold">Add New Airport</h1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Airport Information</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="airportCode">Airport Code *</Label>
								<Input
									id="airportCode"
									placeholder="e.g., DEL, BOM, JFK"
									value={form.airportCode}
									onChange={(e) => setField("airportCode", e.target.value.toUpperCase())}
									maxLength={3}
									required
								/>
								<p className="text-xs text-muted-foreground">3-letter IATA code</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="airportName">Airport Name *</Label>
								<Input
									id="airportName"
									placeholder="e.g., Indira Gandhi International Airport"
									value={form.airportName}
									onChange={(e) => setField("airportName", e.target.value)}
									required
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-3">
							<div className="space-y-2">
								<Label htmlFor="city">City *</Label>
								<Input
									id="city"
									placeholder="e.g., New Delhi"
									value={form.city}
									onChange={(e) => setField("city", e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="state">State/Province</Label>
								<Input
									id="state"
									placeholder="e.g., Delhi"
									value={form.state}
									onChange={(e) => setField("state", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="country">Country *</Label>
								<Input
									id="country"
									placeholder="e.g., India"
									value={form.country}
									onChange={(e) => setField("country", e.target.value)}
									required
								/>
							</div>
						</div>

						{/* <div className="grid gap-4 md:grid-cols-3">
							<div className="space-y-2">
								<Label htmlFor="timezone">Timezone</Label>
								<Input
									id="timezone"
									placeholder="e.g., Asia/Kolkata"
									value={form.timezone}
									onChange={(e) => setField("timezone", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="latitude">Latitude</Label>
								<Input
									id="latitude"
									type="number"
									step="any"
									placeholder="e.g., 28.5562"
									value={form.latitude}
									onChange={(e) => setField("latitude", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="longitude">Longitude</Label>
								<Input
									id="longitude"
									type="number"
									step="any"
									placeholder="e.g., 77.1000"
									value={form.longitude}
									onChange={(e) => setField("longitude", e.target.value)}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								placeholder="Brief description of the airport..."
								value={form.description}
								onChange={(e) => setField("description", e.target.value)}
								maxLength={500}
								rows={3}
							/>
							<p className="text-xs text-muted-foreground">Max 500 characters</p>
						</div> */}

						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								id="isActive"
								checked={form.isActive}
								onChange={(e) => setField("isActive", e.target.checked)}
								className="rounded"
							/>
							<Label htmlFor="isActive">Active</Label>
						</div>

						<div className="flex gap-4">
							<Button 
								type="submit" 
								className="bg-orange-600 hover:bg-orange-700"
								disabled={loading}
							>
								<Save className="size-4 mr-2" />
								{loading ? "Creating..." : "Create Airport"}
							</Button>
							<Link href="/admin-panel/airports">
								<Button variant="outline">Cancel</Button>
							</Link>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
} 