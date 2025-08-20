"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card as UICard, CardContent as UICardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { searchTickets, getProfile, listAirlines } from "@/lib/api";
import Link from "next/link";

export default function BookFlightPage() {
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [date, setDate] = useState("");
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState([]);
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [profile, setProfile] = useState(null);
	const [quantity, setQuantity] = useState(1);
	const [airports, setAirports] = useState([]);
	const [airlines, setAirlines] = useState([]);

	useEffect(() => {
		getProfile().then((d) => setProfile(d?.user || d)).catch(() => {});
		(async () => {
			try {
				const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'}/api/airports?page=1&limit=100`, { headers: { Authorization: `Bearer ${localStorage.getItem('fd_token') || ''}` } });
				const data = await res.json();
				if (res.ok) setAirports(data?.data?.airports || data?.data || []);
			} catch {}
			try {
				const a = await listAirlines({ page: 1, limit: 500, isActive: true });
				setAirlines(a?.items || []);
			} catch {}
		})();
	}, []);

	const markerAmount = Number(profile?.markerAmount || 0);

	const airlineLogoByName = useMemo(() => {
		const m = new Map();
		(airlines || []).forEach(al => { if (al?.name) m.set(al.name.toLowerCase(), al.logoUrl || ""); });
		return m;
	}, [airlines]);

	async function onSearch() {
		if (!from || !to || !date) {
			toast.error("Provide from, to, and date");
			return;
		}
		setLoading(true);
		try {
			const data = await searchTickets({ from: from.toUpperCase(), to: to.toUpperCase(), date, page, limit, quantity: Number(quantity || 1) });
			const items = data?.items || data?.tickets || data?.results || [];
			setResults(items);
		} catch (e) {
			toast.error(e.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Search Flights</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-5">
						<div className="space-y-2">
							<Label>From</Label>
							<input list="from-airports" className="border rounded h-9 w-full px-2" value={from} onChange={(e) => setFrom(e.target.value.toUpperCase())} placeholder="Airport or City" />
							<datalist id="from-airports">
								{airports.map(a => (
									<option key={a._id} value={a.airportCode}>{`${a.airportCode} - ${a.airportName}, ${a.city}`}</option>
								))}
							</datalist>
						</div>
						<div className="space-y-2">
							<Label>To</Label>
							<input list="to-airports" className="border rounded h-9 w-full px-2" value={to} onChange={(e) => setTo(e.target.value.toUpperCase())} placeholder="Airport or City" />
							<datalist id="to-airports">
								{airports.map(a => (
									<option key={a._id} value={a.airportCode}>{`${a.airportCode} - ${a.airportName}, ${a.city}`}</option>
								))}
							</datalist>
						</div>
						<div className="space-y-2">
							<Label>Date</Label>
							<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
						</div>
						<div className="space-y-2">
							<Label>Quantity</Label>
							<Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))} />
						</div>
						<div className="flex items-end">
							<Button onClick={onSearch} className="bg-orange-600 hover:bg-orange-700" disabled={loading}>
								{loading ? "Searching..." : "Search"}
							</Button>
						</div>
					</div>
					<div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{results.map((t) => {
							const logo = airlineLogoByName.get(String(t.airline || '').toLowerCase());
							return (
								<UICard key={t._id} className="border rounded-lg">
									<UICardContent className="p-4 space-y-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												{logo ? (<img src={logo} alt={`${t.airline} logo`} className="h-5 w-5 object-contain" />) : null}
												<div className="text-base font-medium">{t.airline}</div>
											</div>
											<div className="text-xs text-muted-foreground">{t.flightNumber}</div>
										</div>
										<div className="grid grid-cols-2 gap-2 text-sm">
											<div>
												<div className="text-muted-foreground">Departure</div>
												<div>{new Date(t.departureTime).toLocaleString([], { hour12: false })}</div>
											</div>
											<div>
												<div className="text-muted-foreground">Arrival</div>
												<div>{new Date(t.arrivalTime).toLocaleString([], { hour12: false })}</div>
											</div>
										</div>
										<div className="flex items-center justify-between text-sm">
											<div>Base: <strong>₹ {Number(t.basePrice).toLocaleString()}</strong></div>
											<div>Sell: <strong>₹ {(Number(t.basePrice) + markerAmount).toLocaleString()}</strong></div>
										</div>
										<div className="pt-2">
											<Link href={`/agent-panel/book/${t._id}`} className="block">
												<Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">Select</Button>
											</Link>
										</div>
									</UICardContent>
								</UICard>
							);
						})}
						{!loading && results.length === 0 && (
							<div className="col-span-full text-center text-sm text-muted-foreground border rounded-md p-6">No results</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}


