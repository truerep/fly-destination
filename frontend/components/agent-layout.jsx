"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarSeparator } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { CreditCard, LogOut, Plane, Settings, Ticket, Wallet, Percent } from "lucide-react";
import { getProfile } from "@/lib/api";
import { Avatar } from "./ui/avatar";

export default function AgentLayout({ children }) {
	const router = useRouter();
	const pathname = usePathname();
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [authorized, setAuthorized] = useState(false);

	const isRegisterRoute = pathname?.startsWith("/agent-panel/register");

	useEffect(() => {
		if (isRegisterRoute) {
			// Allow access to register page without auth
			setAuthorized(true);
			setLoading(false);
			return;
		}
		async function run() {
			const token = typeof window !== "undefined" ? localStorage.getItem("fd_token") : null;
			const role = typeof window !== "undefined" ? localStorage.getItem("fd_role") : null;
			if (!token || role !== "agent") {
				setAuthorized(false);
				setLoading(false);
				router.replace("/");
				return;
			}
			try {
				const data = await getProfile();
				const user = data?.user || data;
				if (user?.userType !== "agent") {
					setAuthorized(false);
					router.replace("/");
					return;
				}
				setProfile(user);
				setAuthorized(true);
			} catch (e) {
				setAuthorized(false);
				router.replace("/");
			} finally {
				setLoading(false);
			}
		}
		run();
	}, [isRegisterRoute]);

	const availableCredit = useMemo(() => {
		return Math.max(0, Number(profile?.availableCreditLimit || 0));
	}, [profile]);

	const balanceDue = useMemo(() => {
		return Math.max(0, Number(profile?.balanceDue || 0));
	}, [profile]);

	function handleLogout() {
		localStorage.removeItem("fd_role");
		localStorage.removeItem("fd_token");
		localStorage.removeItem("fd_user");
		router.push("/");
	}

	if (isRegisterRoute) {
		return <div className="w-full min-h-screen">{children}</div>;
	}

	if (loading || !authorized) {
		return null;
	}

	return (
		<SidebarProvider>
			<div className="flex w-full min-h-screen">
				<Sidebar>
					<img src="/c-logo.png" alt="logo" className="w-100" />
					{/* <SidebarHeader>Agent Panel</SidebarHeader> */}
					<SidebarContent>
						<SidebarGroup>
							{/* <SidebarGroupLabel>Booking</SidebarGroupLabel> */}
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton asChild data-active={pathname === "/agent-panel/book"}>
											<Link href="/agent-panel/book" className="flex items-center gap-2">
												<Plane className="size-4" />
												<span>Book Flight</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild data-active={pathname === "/agent-panel/calendar-fare"}>
											<Link href="/agent-panel/calendar-fare" className="flex items-center gap-2">
												<Plane className="size-4" />
												<span>Calendar Fare</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild data-active={pathname === "/agent-panel/bookings"}>
											<Link href="/agent-panel/bookings" className="flex items-center gap-2">
												<Ticket className="size-4" />
												<span>My Bookings</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild data-active={pathname === "/agent-panel/promos"}>
											<Link href="/agent-panel/promos" className="flex items-center gap-2">
												<Percent className="size-4" />
												<span>Promo Codes</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild data-active={pathname === "/agent-panel/finance"}>
											<Link href="/agent-panel/finance" className="flex items-center gap-2">
												<Percent className="size-4" />
												<span>Finance</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild data-active={pathname === "/agent-panel/marker"}>
											<Link href="/agent-panel/marker" className="flex items-center gap-2">
												<Wallet className="size-4" />
												<span>Marker</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild data-active={pathname === "/agent-panel/settings"}>
											<Link href="/agent-panel/settings" className="flex items-center gap-2">
												<Settings className="size-4" />
												<span>Settings</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
						<SidebarSeparator className="mx-0" />
						<div className="p-2 text-sm space-y-2">
							<div className="flex items-center gap-2">
								<CreditCard className="size-4" />
								<div className="flex-1">
									<div className="text-muted-foreground">Credit Available</div>
									<div className="font-medium">₹ {availableCredit.toLocaleString()} / ₹ {Number(profile?.totalCreditLimit ?? 0).toLocaleString()}</div>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<CreditCard className="size-4" />
								<div className="flex-1">
									<div className="text-muted-foreground">Balance Due</div>
									<div className="font-medium">₹ {profile?.balanceDue ?? 0}</div>
									{profile?.balanceDue < 0 && (
										<div className="text-xs text-green-700">Advance: ₹ {profile?.balanceDue}</div>
									)}
								</div>
							</div>
						</div>
					</SidebarContent>
					<SidebarFooter>
						<Button 
							variant="outline" 
							onClick={handleLogout}
							className="w-full flex items-center gap-2"
						>
							<LogOut className="size-4" />
							Logout
						</Button>
					</SidebarFooter>
				</Sidebar>
				<SidebarInset className="p-6 w-full">
					{children}
				</SidebarInset>
			</div>
		</SidebarProvider>
	);
}


