import Image from "next/image";
import Link from "next/link";
import HomeGate from "@/components/home-gate";

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

export default function HomePage() {
	return (
		<main className="container mx-auto px-4 py-10 space-y-10">
			<div className="flex items-center justify-between">
				<Logo />
				<ContactInfo />
			</div>
			<HomeGate />
		</main>
	);
}
