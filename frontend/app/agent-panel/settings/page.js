"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { API_BASE } from "@/lib/api";

export default function SettingsPage() {
	const [profile, setProfile] = useState(null);
	const [uploading, setUploading] = useState(false);

	useEffect(() => { getProfile().then((d) => setProfile(d?.user || d)).catch(() => {}); }, []);

	async function onUpload(file) {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = async () => {
			setUploading(true);
			try {
				const res = await fetch(`${API_BASE}/api/auth/profile`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${localStorage.getItem('fd_token') || ''}`
					},
					body: JSON.stringify({ profileImageBase64: String(reader.result || '') })
				});
				const data = await res.json();
				if (res.ok) {
					const user = data?.data?.user || data?.data || data;
					setProfile(user);
					toast.success('Profile image updated');
				} else {
					toast.error(data?.message || 'Failed to update profile image');
				}
			} finally {
				setUploading(false);
			}
		};
		reader.readAsDataURL(file);
	}
	return (
		<Card>
			<CardHeader>
				<CardTitle>Settings</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center gap-4">
					<div className="h-16 w-16 rounded-full bg-muted overflow-hidden flex items-center justify-center">
						{profile?.profileImageUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={profile.profileImageUrl} alt="profile" className="h-full w-full object-cover" />
						) : (
							<span className="text-xs text-muted-foreground">No Image</span>
						)}
					</div>
					<div>
						<Label className="text-sm">Change Profile Image</Label>
						<Input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0])} disabled={uploading} />
					</div>
				</div>
				<div className="text-sm space-y-1">
					<div><strong>Agent ID:</strong> {profile?.agentId || "-"}</div>
					<div><strong>Email:</strong> {profile?.email || "-"}</div>
					<div><strong>Phone:</strong> {profile?.phoneNumber || "-"}</div>
				</div>
			</CardContent>
		</Card>
	);
}


