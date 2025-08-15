"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card as UICard, CardContent as UICardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { searchTickets, createBooking, getProfile } from "@/lib/api";

export default function BookFlightPage() {
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [date, setDate] = useState("");
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState([]);
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [profile, setProfile] = useState(null);

	useEffect(() => {
		getProfile().then((d) => setProfile(d?.user || d)).catch(() => {});
	}, []);

	const markerAmount = Number(profile?.markerAmount || 0);

	async function onSearch() {
		if (!from || !to || !date) {
			toast.error("Provide from, to, and date");
			return;
		}
		setLoading(true);
		try {
			const data = await searchTickets({ from: from.toUpperCase(), to: to.toUpperCase(), date, page, limit });
			const items = data?.items || data?.tickets || data?.results || [];
			setResults(items);
		} catch (e) {
			toast.error(e.message);
		} finally {
			setLoading(false);
		}
	}

	const [selected, setSelected] = useState(null);
	const [quantity, setQuantity] = useState(1);
	const [infants, setInfants] = useState(0);
	const [passengers, setPassengers] = useState([]);

	function initPassengers(qty) {
		const arr = Array.from({ length: qty }, (_, i) => ({ firstName: "", lastName: "", gender: "", type: "adult" }));
		setPassengers(arr);
	}

	useEffect(() => {
		initPassengers(quantity);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [quantity]);

const unitSellingPrice = useMemo(() => {
		if (!selected) return 0;
		return Number(selected.basePrice || 0) + markerAmount;
	}, [selected, markerAmount]);

	async function submitBooking() {
		if (!selected) return;
		try {
			const payload = {
				ticketId: selected._id,
				quantity: Number(quantity),
				infants: Number(infants || 0),
				passengers,
			};
			const data = await createBooking(payload);
			toast.success("Booking created");
			setSelected(null);
			setPassengers([]);
		} catch (e) {
			toast.error(e.message);
		}
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Search Flights</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-4">
						<div className="space-y-2">
							<Label>From (IATA)</Label>
							<Input value={from} onChange={(e) => setFrom(e.target.value.toUpperCase())} placeholder="DEL" maxLength={3} />
						</div>
						<div className="space-y-2">
							<Label>To (IATA)</Label>
							<Input value={to} onChange={(e) => setTo(e.target.value.toUpperCase())} placeholder="BOM" maxLength={3} />
						</div>
						<div className="space-y-2">
							<Label>Date</Label>
							<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
						</div>
						<div className="flex items-end">
							<Button onClick={onSearch} className="bg-orange-600 hover:bg-orange-700" disabled={loading}>
								{loading ? "Searching..." : "Search"}
							</Button>
						</div>
					</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((t) => (
              <UICard key={t._id} className="border rounded-lg">
                <UICardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-base font-medium">{t.airline}</div>
                    <div className="text-xs text-muted-foreground">{t.flightNumber}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Departure</div>
                      <div>{new Date(t.departureTime).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Arrival</div>
                      <div>{new Date(t.arrivalTime).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div>Base: <strong>₹ {Number(t.basePrice).toLocaleString()}</strong></div>
                    <div>Sell: <strong>₹ {(Number(t.basePrice) + markerAmount).toLocaleString()}</strong></div>
                  </div>
                  <div className="pt-2">
                    <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => { setSelected(t); setQuantity(1); setInfants(0); initPassengers(1); }}>Select</Button>
                  </div>
                </UICardContent>
              </UICard>
            ))}
            {!loading && results.length === 0 && (
              <div className="col-span-full text-center text-sm text-muted-foreground border rounded-md p-6">No results</div>
            )}
          </div>
				</CardContent>
			</Card>

			{selected && (
				<Card>
					<CardHeader>
						<CardTitle>Passenger Details & Confirm</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-3">
							<div>
								<Label>Quantity</Label>
								<Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))} />
							</div>
							<div>
								<Label>Infants</Label>
								<Input type="number" min={0} value={infants} onChange={(e) => setInfants(Math.max(0, Number(e.target.value || 0)))} />
							</div>
            <div className="self-end">
              <div className="text-sm">Unit Selling Price: <strong>₹ {unitSellingPrice.toLocaleString()}</strong></div>
              <div className="text-sm">Total Selling: <strong>₹ {(unitSellingPrice * quantity).toLocaleString()}</strong></div>
            </div>
						</div>

          {/* Inline marker amount override */}
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <Label>Marker Amount (₹)</Label>
              <Input
                type="number"
                min={0}
                value={markerAmount}
                onChange={(e) => {
                  const v = Math.max(0, Number(e.target.value || 0));
                  // Update via API and refresh profile
                  (async () => {
                    try {
                      const { updateMarkerAmount, getProfile } = await import("@/lib/api");
                      await updateMarkerAmount(v);
                      const fresh = await getProfile();
                      setProfile(fresh?.user || fresh);
                    } catch (err) {
                      toast.error(err.message || 'Failed to update marker amount');
                    }
                  })();
                }}
              />
            </div>
          </div>

						<div className="space-y-3">
							{passengers.map((p, idx) => (
								<div key={idx} className="grid gap-2 md:grid-cols-4">
									<div>
										<Label>First Name</Label>
										<Input value={p.firstName} onChange={(e) => setPassengers(prev => prev.map((x, i) => i === idx ? { ...x, firstName: e.target.value } : x))} />
									</div>
									<div>
										<Label>Last Name</Label>
										<Input value={p.lastName} onChange={(e) => setPassengers(prev => prev.map((x, i) => i === idx ? { ...x, lastName: e.target.value } : x))} />
									</div>
									<div>
										<Label>Gender</Label>
										<Input value={p.gender} onChange={(e) => setPassengers(prev => prev.map((x, i) => i === idx ? { ...x, gender: e.target.value } : x))} placeholder="male/female/other" />
									</div>
									<div>
										<Label>Type</Label>
										<Input value={p.type} onChange={(e) => setPassengers(prev => prev.map((x, i) => i === idx ? { ...x, type: e.target.value } : x))} placeholder="adult/child" />
									</div>
								</div>
							))}
						</div>

						<div className="flex gap-2">
							<Button className="bg-orange-600 hover:bg-orange-700" onClick={submitBooking}>Confirm Booking</Button>
							<Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}


