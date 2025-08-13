"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { Users, LogOut, Plane } from "lucide-react";
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
					<SidebarHeader>Admin Panel</SidebarHeader>
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>Management</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton asChild>
											<Link href="/admin-panel/agents" className="flex items-center gap-2">
												<Users className="size-4" />
												<span>Agents</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton asChild>
											<Link href="/admin-panel/airports" className="flex items-center gap-2">
												<Plane className="size-4" />
												<span>Airports</span>
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