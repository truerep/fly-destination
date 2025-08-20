"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Upload, Building2, User, MapPin, FileText } from "lucide-react";
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

export default function AgentRegisterPage() {
	const [form, setForm] = useState({
		userType: "agent",
		email: "",
		password: "",
		phoneNumber: "",
		companyName: "",
		gst: "",
		pan: "",
		panName: "",
		contactPersonName: "",
		contactPersonDesignation: "",
		contactPersonEmail: "",
		contactPersonMobile: "",
		address: "",
		city: "",
		state: "",
		country: "",
		pincode: "",
		remark: "",
		profileImageBase64: "",
	});

	const [isLoading, setIsLoading] = useState(false);
	const [imagePreview, setImagePreview] = useState(null);

	function setField(k, v) { setForm((f) => ({ ...f, [k]: v })); }

	const handleImageUpload = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		
		// Create preview
		const reader = new FileReader();
		reader.onload = () => {
			setImagePreview(reader.result);
			setField('profileImageBase64', String(reader.result || ''));
		};
		reader.readAsDataURL(file);
	};

	async function onSubmit() {
		if (!form.email || !form.password || !form.companyName) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsLoading(true);
		try {
			const res = await fetch(`${API_BASE}/api/auth/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			const data = await res.json();
			if (res.ok) {
				toast.success(data?.message || "Registration successful! Welcome aboard!");
			} else {
				toast.error(data?.message || "Registration failed. Please try again.");
			}
		} catch (e) {
			toast.error("Network error. Please check your connection.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<main className="container mx-auto px-4 py-10 space-y-10">
			<div className="flex items-center justify-between">
				<Logo />
				<ContactInfo />
			</div>
			
			<div className="max-w-4xl mx-auto">
				<div className="mb-8 text-center">
					<h1 className="text-3xl font-bold mb-2">Agent Registration</h1>
					<p className="text-muted-foreground">Join our network of trusted travel agents</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Building2 className="w-5 h-5" />
							New Agent Registration
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
							{/* Profile Image Section */}
							<div className="space-y-4">
								<div className="flex items-center gap-2 text-lg font-semibold">
									<User className="w-5 h-5" />
									Profile Information
								</div>
								<div className="grid md:grid-cols-2 gap-6">
									<div className="space-y-4">
										<div className="space-y-2">
											<Label>Profile Image</Label>
											<div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors">
												<input
													type="file"
													accept="image/*"
													onChange={handleImageUpload}
													className="hidden"
													id="profile-image"
												/>
												<label htmlFor="profile-image" className="cursor-pointer">
													<Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
													<p className="text-sm text-muted-foreground">Click to upload image</p>
												</label>
											</div>
											{imagePreview && (
												<div className="mt-2">
													<img src={imagePreview} alt="Preview" className="h-50 rounded-lg object-cover" />
												</div>
											)}
										</div>
									</div>
									<div className="space-y-4">
										<div className="space-y-2">
											<Label>Email *</Label>
											<Input 
												type="email"
												value={form.email} 
												onChange={(e) => setField("email", e.target.value)}
												placeholder="Enter your email"
											/>
										</div>
										<div className="space-y-2">
											<Label>Password *</Label>
											<Input 
												type="password" 
												value={form.password} 
												onChange={(e) => setField("password", e.target.value)}
												placeholder="Create a strong password"
											/>
										</div>
										<div className="space-y-2">
											<Label>Phone Number</Label>
											<Input 
												value={form.phoneNumber} 
												onChange={(e) => setField("phoneNumber", e.target.value)}
												placeholder="Enter phone number"
											/>
										</div>
									</div>
								</div>
							</div>

							<Separator />

							{/* Company Information */}
							<div className="space-y-4">
								<div className="flex items-center gap-2 text-lg font-semibold">
									<Building2 className="w-5 h-5" />
									Company Information
								</div>
								<div className="grid md:grid-cols-2 gap-6">
									<div className="space-y-2">
										<Label>Company Name *</Label>
										<Input 
											value={form.companyName} 
											onChange={(e) => setField("companyName", e.target.value)}
											placeholder="Enter company name"
										/>
									</div>
									<div className="space-y-2">
										<Label>GST Number</Label>
										<Input 
											value={form.gst} 
											onChange={(e) => setField("gst", e.target.value)}
											placeholder="Enter GST number"
										/>
									</div>
									<div className="space-y-2">
										<Label>PAN Number</Label>
										<Input 
											value={form.pan} 
											onChange={(e) => setField("pan", e.target.value)}
											placeholder="Enter PAN number"
										/>
									</div>
									<div className="space-y-2">
										<Label>PAN Name</Label>
										<Input 
											value={form.panName} 
											onChange={(e) => setField("panName", e.target.value)}
											placeholder="Enter PAN holder name"
										/>
									</div>
								</div>
							</div>

							<Separator />

							{/* Contact Person Information */}
							<div className="space-y-4">
								<div className="flex items-center gap-2 text-lg font-semibold">
									<User className="w-5 h-5" />
									Contact Person Details
								</div>
								<div className="grid md:grid-cols-2 gap-6">
									<div className="space-y-2">
										<Label>Contact Person Name</Label>
										<Input 
											value={form.contactPersonName} 
											onChange={(e) => setField("contactPersonName", e.target.value)}
											placeholder="Enter contact person name"
										/>
									</div>
									<div className="space-y-2">
										<Label>Designation</Label>
										<Input 
											value={form.contactPersonDesignation} 
											onChange={(e) => setField("contactPersonDesignation", e.target.value)}
											placeholder="Enter designation"
										/>
									</div>
									<div className="space-y-2">
										<Label>Contact Email</Label>
										<Input 
											type="email"
											value={form.contactPersonEmail} 
											onChange={(e) => setField("contactPersonEmail", e.target.value)}
											placeholder="Enter contact email"
										/>
									</div>
									<div className="space-y-2">
										<Label>Contact Mobile</Label>
										<Input 
											value={form.contactPersonMobile} 
											onChange={(e) => setField("contactPersonMobile", e.target.value)}
											placeholder="Enter contact mobile"
										/>
									</div>
								</div>
							</div>

							<Separator />

							{/* Address Information */}
							<div className="space-y-4">
								<div className="flex items-center gap-2 text-lg font-semibold">
									<MapPin className="w-5 h-5" />
									Address Information
								</div>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label>Address</Label>
										<Textarea 
											value={form.address} 
											onChange={(e) => setField("address", e.target.value)}
											placeholder="Enter complete address"
											rows={3}
										/>
									</div>
									<div className="grid md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label>City</Label>
											<Input 
												value={form.city} 
												onChange={(e) => setField("city", e.target.value)}
												placeholder="Enter city"
											/>
										</div>
										<div className="space-y-2">
											<Label>State</Label>
											<Input 
												value={form.state} 
												onChange={(e) => setField("state", e.target.value)}
												placeholder="Enter state"
											/>
										</div>
										<div className="space-y-2">
											<Label>Country</Label>
											<Input 
												value={form.country} 
												onChange={(e) => setField("country", e.target.value)}
												placeholder="Enter country"
											/>
										</div>
										<div className="space-y-2">
											<Label>Pincode</Label>
											<Input 
												value={form.pincode} 
												onChange={(e) => setField("pincode", e.target.value)}
												placeholder="Enter pincode"
											/>
										</div>
									</div>
								</div>
							</div>

							<Separator />

							{/* Additional Information */}
							<div className="space-y-4">
								<div className="flex items-center gap-2 text-lg font-semibold">
									<FileText className="w-5 h-5" />
									Additional Information
								</div>
								<div className="space-y-2">
									<Label>Remarks</Label>
									<Textarea 
										value={form.remark} 
										onChange={(e) => setField("remark", e.target.value)}
										placeholder="Any additional comments or special requirements"
										rows={3}
									/>
								</div>
							</div>

							<div className="pt-6">
								<Button 
									type="submit"
									disabled={isLoading}
									className="bg-orange-600 hover:bg-orange-700 w-full"
								>
									{isLoading ? (
										<>
											<Loader2 className="w-5 h-5 mr-2 animate-spin" />
											Processing Registration...
										</>
									) : (
										"Complete Registration"
									)}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</main>
	);
} 