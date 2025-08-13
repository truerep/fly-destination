"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getProfile, updateMarkerAmount } from "@/lib/api";

export default function MarkerPage() {
	const [profile, setProfile] = useState(null);
	const [value, setValue] = useState(0);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		getProfile().then((d) => {
			const u = d?.user || d;
			setProfile(u);
			setValue(Number(u?.markerAmount || 0));
		});
	}, []);

	async function save() {
		setLoading(true);
		try {
			await updateMarkerAmount(Number(value));
			toast.success("Marker amount updated");
			const fresh = await getProfile();
			setProfile(fresh?.user || fresh);
		} catch (e) {
			toast.error(e.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Marker Amount</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="text-sm text-muted-foreground">Current marker amount affects selling price: base price + marker amount.</div>
				<div className="grid max-w-md gap-2">
					<Label>Marker Amount (₹)</Label>
					<Input type="number" min={0} value={value} onChange={(e) => setValue(Math.max(0, Number(e.target.value || 0)))} />
				</div>
				<Button className="bg-orange-600 hover:bg-orange-700" onClick={save} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
			</CardContent>
		</Card>
	);
}


