"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { Users, LogOut, Plane, Ticket, ListChecks, ClipboardList, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }) {
	const router = useRouter();
	const pathname = usePathname();

	function handleLogout() {
		localStorage.removeItem("fd_role");
		localStorage.removeItem("fd_token");
		localStorage.removeItem("fd_user");
		router.push("/");
	}

	return (
		<SidebarProvider>
			<div className="flex w-full min-h-screen">
				<Sidebar>
					<img src="/c-logo.png" alt="logo" className="w-100" />
					{/* <SidebarHeader>Admin Panel</SidebarHeader> */}
					<SidebarContent>
						<SidebarGroup>
							{/* <SidebarGroupLabel>Management</SidebarGroupLabel> */}
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton asChild data-active={pathname === "/admin-panel/bookings"}>
											<Link href="/admin-panel/bookings" className="flex items-center gap-2">
												<ListChecks className="size-4" />
												<span>Bookings</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild data-active={pathname === "/admin-panel/tickets"}>
											<Link href="/admin-panel/tickets" className="flex items-center gap-2">
												<Ticket className="size-4" />
												<span>Tickets</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild data-active={pathname === "/admin-panel/agents"}>
											<Link href="/admin-panel/agents" className="flex items-center gap-2">
												<Users className="size-4" />
												<span>Agents</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild data-active={pathname === "/admin-panel/finance"}>
											<Link href="/admin-panel/finance" className="flex items-center gap-2">
												<Ticket className="size-4" />
												<span>Finance</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild data-active={pathname === "/admin-panel/requests"}>
											<Link href="/admin-panel/requests" className="flex items-center gap-2">
												<ClipboardList className="size-4" />
												<span>Change Request</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild data-active={pathname === "/admin-panel/promos"}>
											<Link href="/admin-panel/promos" className="flex items-center gap-2">
												<Percent className="size-4" />
												<span>Promo Codes</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild data-active={pathname === "/admin-panel/airports"}>
											<Link href="/admin-panel/airports" className="flex items-center gap-2">
												<Plane className="size-4" />
												<span>Airports</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild data-active={pathname === "/admin-panel/airlines"}>
											<Link href="/admin-panel/airlines" className="flex items-center gap-2">
												<Plane className="size-4" />
												<span>Airlines</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>
					<div className="p-4">
						<Button 
							variant="outline" 
							onClick={handleLogout}
							className="w-full flex items-center gap-2"
						>
							<LogOut className="size-4" />
							Logout
						</Button>
					</div>
				</Sidebar>
				<SidebarInset className="p-6 w-full">
					{children}
				</SidebarInset>
			</div>
		</SidebarProvider>
	);
} 