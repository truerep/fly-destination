"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
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

export default function ForgotPasswordPage() {
	const [identifier, setIdentifier] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!identifier.trim()) {
			toast.error("Please enter your email, phone number, or agent ID");
			return;
		}

		setIsLoading(true);
		try {
			const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ identifier: identifier.trim() }),
			});
			
			const data = await res.json();
			
			if (res.ok) {
				toast.success(data?.message || "Password reset link sent to your email");
				setIsSubmitted(true);
			} else {
				toast.error(data?.message || "Failed to send reset link");
			}
		} catch (error) {
			toast.error("Network error. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

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
							<Mail className="w-5 h-5" />
							Forgot Password
						</CardTitle>
						<CardDescription>
							Enter your email, phone number, or agent ID to receive a password reset link
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{!isSubmitted ? (
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="identifier">Email / Phone / Agent ID</Label>
									<Input 
										id="identifier" 
										placeholder="agent@example.com or +91.. or FD1234"
										value={identifier}
										onChange={(e) => setIdentifier(e.target.value)}
									/>
								</div>
								<Button 
									type="submit"
									className="bg-orange-600 hover:bg-orange-700 w-full" 
									disabled={isLoading}
								>
									{isLoading ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Sending...
										</>
									) : (
										"Send Reset Link"
									)}
								</Button>
							</form>
						) : (
							<div className="text-center space-y-4">
								<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
									<Mail className="w-8 h-8 text-green-600" />
								</div>
								<div>
									<h3 className="font-semibold text-lg mb-2">Check Your Email</h3>
									<p className="text-muted-foreground text-sm">
										We've sent a password reset link to your email address. 
										Please check your inbox and follow the instructions.
									</p>
								</div>
								<div className="text-xs text-muted-foreground">
									<p>Didn't receive the email? Check your spam folder or</p>
									<button 
										onClick={() => setIsSubmitted(false)}
										className="text-orange-600 hover:underline"
									>
										try again
									</button>
								</div>
							</div>
						)}
						
						<div className="text-center">
							<Link href="/" className="text-orange-600 text-sm flex items-center justify-center gap-1">
								<ArrowLeft className="w-4 h-4" />
								Back to Login
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
