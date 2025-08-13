"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, Search, Edit, Trash2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function AirportsPage() {
	const [airports, setAirports] = useState([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);
	const [limit, setLimit] = useState(10);

	async function fetchAirports() {
		setLoading(true);
		try {
			const url = new URL(`${API_BASE}/api/airports`);
			url.searchParams.set("page", String(page));
			url.searchParams.set("limit", String(limit));
			if (search) url.searchParams.set("search", search);
			const res = await fetch(url.toString(), {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("fd_token") || ""}`,
				},
			});
			const data = await res.json();
			if (res.ok && data?.data) {
				setAirports(data.data.items || data.data.airports || []);
				setTotal(data.data.total || 0);
			} else {
				console.error(data);
				toast.error(data?.message || "Failed to fetch airports");
			}
		} catch (error) {
			toast.error("Failed to fetch airports");
		} finally {
			setLoading(false);
		}
	}

	async function deleteAirport(id) {
		if (!confirm("Are you sure you want to delete this airport?")) return;
		
		try {
			const res = await fetch(`${API_BASE}/api/airports/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("fd_token") || ""}`,
				},
			});
			const data = await res.json();
			if (res.ok) {
				toast.success("Airport deleted successfully");
				fetchAirports();
			} else {
				toast.error(data?.message || "Failed to delete airport");
			}
		} catch (error) {
			toast.error("Failed to delete airport");
		}
	}

	useEffect(() => {
		fetchAirports();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, limit]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Airports</span>
					<Link href="/admin-panel/airports/create">
						<Button className="bg-orange-600 hover:bg-orange-700">
							<Plus className="size-4 mr-2" />
							Add Airport
						</Button>
					</Link>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-center gap-2 mb-4">
					<Input 
						placeholder="Search airport code, name, city, country" 
						value={search} 
						onChange={(e) => setSearch(e.target.value)} 
					/>
					<Button 
						className="bg-orange-600 hover:bg-orange-700" 
						onClick={() => { setPage(1); fetchAirports(); }}
					>
						<Search className="size-4 mr-2" />
						Search
					</Button>
				</div>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Code</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Location</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{airports.map((airport, idx) => (
								<TableRow key={airport._id || idx}>
									<TableCell className="font-mono font-bold">{airport.airportCode}</TableCell>
									<TableCell>{airport.airportName}</TableCell>
									<TableCell>
										<div className="flex flex-col">
											<span>{airport.city}</span>
											<span className="text-xs text-muted-foreground">
												{airport.state && `${airport.state}, `}{airport.country}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant={airport.isActive ? "default" : "secondary"}>
											{airport.isActive ? "Active" : "Inactive"}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Link href={`/admin-panel/airports/${airport._id}/edit`}>
												<Button variant="outline" size="sm">
													<Edit className="size-3" />
												</Button>
											</Link>
											<Button 
												variant="outline" 
												size="sm"
												onClick={() => deleteAirport(airport._id)}
											>
												<Trash2 className="size-3" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
							{!loading && airports.length === 0 && (
								<TableRow>
									<TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
										No airports found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex items-center gap-2 justify-end mt-4">
					<Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
						Previous
					</Button>
					<div className="text-sm">Page {page}</div>
					<Button variant="outline" disabled={airports.length < limit} onClick={() => setPage((p) => p + 1)}>
						Next
					</Button>
				</div>
			</CardContent>
		</Card>
	);
} 