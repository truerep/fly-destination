"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

function Logo() {
	return (
		<div className="flex items-center gap-3">
			<div className="size-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">FD</div>
			<div className="text-2xl font-bold">Fly Destination</div>
		</div>
	);
}

function ContactInfo() {
	return (
		<div className="text-sm text-muted-foreground space-y-1">
			<div>Email: <Link href="mailto:contact@flydestination.com" className="text-orange-600">contact@flydestination.com</Link></div>
			<div>Phone: <Link href="tel:+911234567890" className="text-orange-600">+91 12345 67890</Link></div>
		</div>
	);
}

export default function ResetPasswordPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const token = searchParams.get('token');
	
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	useEffect(() => {
		if (!token) {
			toast.error("Invalid reset link. Please request a new password reset.");
			router.push('/forgot-password');
		}
	}, [token, router]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!password.trim()) {
			toast.error("Please enter a new password");
			return;
		}

		if (password.length < 6) {
			toast.error("Password must be at least 6 characters long");
			return;
		}

		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		setIsLoading(true);
		try {
			const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, password }),
			});
			
			const data = await res.json();
			
			if (res.ok) {
				toast.success(data?.message || "Password reset successful!");
				setIsSuccess(true);
			} else {
				toast.error(data?.message || "Failed to reset password");
			}
		} catch (error) {
			toast.error("Network error. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	if (!token) {
		return null;
	}

	return (
		<main className="container mx-auto px-4 py-10 space-y-10">
			<div className="flex items-center justify-between">
				<Logo />
				<ContactInfo />
			</div>
			
			<div className="flex justify-center">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Lock className="w-5 h-5" />
							Reset Password
						</CardTitle>
						<CardDescription>
							Enter your new password below
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{!isSuccess ? (
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="password">New Password</Label>
									<div className="relative">
										<Input 
											id="password" 
											type={showPassword ? "text" : "password"}
											placeholder="Enter new password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
										>
											{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
										</button>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="confirmPassword">Confirm New Password</Label>
									<div className="relative">
										<Input 
											id="confirmPassword" 
											type={showConfirmPassword ? "text" : "password"}
											placeholder="Confirm new password"
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
										>
											{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
										</button>
									</div>
								</div>
								<Button 
									type="submit"
									className="bg-orange-600 hover:bg-orange-700 w-full" 
									disabled={isLoading}
								>
									{isLoading ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Resetting...
										</>
									) : (
										"Reset Password"
									)}
								</Button>
							</form>
						) : (
							<div className="text-center space-y-4">
								<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
									<Lock className="w-8 h-8 text-green-600" />
								</div>
								<div>
									<h3 className="font-semibold text-lg mb-2">Password Reset Successful!</h3>
									<p className="text-muted-foreground text-sm">
										Your password has been successfully reset. You can now login with your new password.
									</p>
								</div>
								<Button 
									onClick={() => router.push('/')}
									className="bg-orange-600 hover:bg-orange-700 w-full"
								>
									Go to Login
								</Button>
							</div>
						)}
						
						{!isSuccess && (
							<div className="text-center">
								<Link href="/" className="text-orange-600 text-sm flex items-center justify-center gap-1">
									<ArrowLeft className="w-4 h-4" />
									Back to Login
								</Link>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
