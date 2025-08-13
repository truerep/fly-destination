"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile } from "@/lib/api";

export default function SettingsPage() {
	const [profile, setProfile] = useState(null);
	useEffect(() => { getProfile().then((d) => setProfile(d?.user || d)).catch(() => {}); }, []);
	return (
		<Card>
			<CardHeader>
				<CardTitle>Settings</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="text-sm space-y-1">
					<div><strong>Agent ID:</strong> {profile?.agentId || "-"}</div>
					<div><strong>Email:</strong> {profile?.email || "-"}</div>
					<div><strong>Phone:</strong> {profile?.phoneNumber || "-"}</div>
				</div>
			</CardContent>
		</Card>
	);
}


