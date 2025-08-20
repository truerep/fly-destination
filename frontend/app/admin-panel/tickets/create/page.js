"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createTicket, listAirlines } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function CreateTicketPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState({
		fromAirport: "",
		toAirport: "",
		airline: "",
		flightNumber: "",
		departureTime: "",
		arrivalTime: "",
		basePrice: "",
		infantPrice: "",
		pnr: "",
		quantityTotal: "",
		cabinBagWeight: "7",
		checkinBagWeight: "15",
		infantCabinBagWeight: "7",
		infantCheckinBagWeight: "0",
	});
	const [airlines, setAirlines] = useState([]);

	function setField(k, v) { setForm((p) => ({ ...p, [k]: v })); }

	async function onSubmit(e) {
		e.preventDefault();
		setLoading(true);
		try {
			await createTicket({
				...form,
				fromAirport: form.fromAirport.toUpperCase(),
				toAirport: form.toAirport.toUpperCase(),
				basePrice: Number(form.basePrice),
				infantPrice: Number(form.infantPrice || 0),
				pnr: form.pnr?.trim() || undefined,
				quantityTotal: Number(form.quantityTotal),
				cabinBagWeight: Number(form.cabinBagWeight),
				checkinBagWeight: Number(form.checkinBagWeight),
				infantCabinBagWeight: Number(form.infantCabinBagWeight),
				infantCheckinBagWeight: Number(form.infantCheckinBagWeight),
			});
			toast.success("Ticket created");
			router.push("/admin-panel/tickets");
		} catch (e) {
			toast.error(e.message);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => { (async () => { try { const data = await listAirlines({ page: 1, limit: 200, isActive: true }); setAirlines(data?.items || []); } catch {} })(); }, []);

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link href="/admin-panel/tickets"><Button variant="outline" size="sm"><ArrowLeft className="size-4 mr-2"/>Back</Button></Link>
				<h1 className="text-2xl font-bold">Add Ticket</h1>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Ticket Details</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit} className="grid gap-4">
						<div className="grid md:grid-cols-4 gap-4">
							<div className="space-y-2">
								<Label>From (IATA)</Label>
								<Input value={form.fromAirport} onChange={(e) => setField("fromAirport", e.target.value.toUpperCase())} maxLength={3} required />
							</div>
							<div className="space-y-2">
								<Label>To (IATA)</Label>
								<Input value={form.toAirport} onChange={(e) => setField("toAirport", e.target.value.toUpperCase())} maxLength={3} required />
							</div>
							<div className="space-y-2">
								<Label>Airline</Label>
								<select className="border rounded h-9 w-full px-2" value={form.airline} onChange={(e) => setField("airline", e.target.value)} required>
									<option value="">Select airline</option>
									{airlines.map(a => (
										<option key={a._id} value={a.name}>{a.name}</option>
									))}
								</select>
							</div>
							<div className="space-y-2">
								<Label>Flight Number</Label>
								<Input value={form.flightNumber} onChange={(e) => setField("flightNumber", e.target.value)} required />
							</div>
						</div>
						<div className="grid md:grid-cols-4 gap-4">
							<div className="space-y-2">
								<Label>Departure Time</Label>
								<Input type="datetime-local" value={form.departureTime} onChange={(e) => setField("departureTime", e.target.value)} required />
							</div>
							<div className="space-y-2">
								<Label>Arrival Time</Label>
								<Input type="datetime-local" value={form.arrivalTime} onChange={(e) => setField("arrivalTime", e.target.value)} required />
							</div>
							<div className="space-y-2">
								<Label>Base Price (₹)</Label>
								<Input type="number" min={0} value={form.basePrice} onChange={(e) => setField("basePrice", e.target.value)} required />
							</div>
							<div className="space-y-2">
								<Label>Infant Price (₹)</Label>
								<Input type="number" min={0} value={form.infantPrice} onChange={(e) => setField("infantPrice", e.target.value)} />
							</div>
							<div className="space-y-2">
								<Label>PNR (optional)</Label>
								<Input value={form.pnr} onChange={(e) => setField("pnr", e.target.value)} placeholder="e.g., ABC123" />
							</div>
						</div>
						<div className="grid md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Total Quantity</Label>
								<Input type="number" min={0} value={form.quantityTotal} onChange={(e) => setField("quantityTotal", e.target.value)} required />
							</div>
						</div>
						<div className="grid md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Cabin Bag Weight (kg)</Label>
								<Input type="number" min={0} step={0.5} value={form.cabinBagWeight} onChange={(e) => setField("cabinBagWeight", e.target.value)} required />
							</div>
							<div className="space-y-2">
								<Label>Check-in Bag Weight (kg)</Label>
								<Input type="number" min={0} step={0.5} value={form.checkinBagWeight} onChange={(e) => setField("checkinBagWeight", e.target.value)} required />
							</div>
						</div>
						<div className="grid md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Infant Cabin Bag Weight (kg)</Label>
								<Input type="number" min={0} step={0.5} value={form.infantCabinBagWeight} onChange={(e) => setField("infantCabinBagWeight", e.target.value)} required />
							</div>
							<div className="space-y-2">
								<Label>Infant Check-in Bag Weight (kg)</Label>
								<Input type="number" min={0} step={0.5} value={form.infantCheckinBagWeight} onChange={(e) => setField("infantCheckinBagWeight", e.target.value)} required />
							</div>
						</div>
						<div className="flex gap-4">
							<Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={loading}><Save className="size-4 mr-2"/>{loading ? "Saving..." : "Create Ticket"}</Button>
							<Link href="/admin-panel/tickets"><Button variant="outline">Cancel</Button></Link>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}


