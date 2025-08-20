"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPanel() {
	const router = useRouter();

	useEffect(() => {
		router.push("/admin-panel/agents");
	}, [router]);

	return null;
} 