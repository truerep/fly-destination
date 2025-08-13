"use client";

import { useEffect } from "react";
import { theme } from "@/constants/theme";

export function ThemeVars() {
	useEffect(() => {
		const root = document.documentElement;
		root.style.setProperty("--primary", theme.colors.primary.DEFAULT);
		root.style.setProperty("--primary-foreground", theme.colors.primary.foreground);
		root.style.setProperty("--accent", theme.colors.accent);
		root.style.setProperty("--background", theme.colors.background);
		root.style.setProperty("--foreground", theme.colors.foreground);
		root.style.setProperty("--border", theme.colors.border);
	}, []);
	return null;
}

export default ThemeVars; 