"use client";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

function authHeaders(extra = {}) {
	return {
		Authorization: `Bearer ${typeof window !== "undefined" ? (localStorage.getItem("fd_token") || "") : ""}`,
		...extra,
	};
}

export async function getProfile() {
	const res = await fetch(`${API_BASE}/api/auth/profile`, { headers: authHeaders() });
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || "Failed to load profile");
	return data?.data || data;
}

export async function searchTickets({ from, to, date, page = 1, limit = 10 }) {
	const url = new URL(`${API_BASE}/api/bookings/search`);
	url.searchParams.set("from", from);
	url.searchParams.set("to", to);
	url.searchParams.set("date", date);
	url.searchParams.set("page", String(page));
	url.searchParams.set("limit", String(limit));
	const res = await fetch(url.toString(), { headers: authHeaders() });
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || "Failed to search tickets");
	return data?.data || data;
}

export async function createBooking(payload) {
	const res = await fetch(`${API_BASE}/api/bookings`, {
		method: "POST",
		headers: authHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify(payload),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || "Failed to create booking");
	return data?.data || data;
}

export async function listMyBookings({ page = 1, limit = 10, q, reference, pnr } = {}) {
	const url = new URL(`${API_BASE}/api/bookings`);
	url.searchParams.set("page", String(page));
	url.searchParams.set("limit", String(limit));
	if (q) url.searchParams.set("q", q);
	if (reference) url.searchParams.set("reference", reference);
	if (pnr) url.searchParams.set("pnr", pnr);
	const res = await fetch(url.toString(), { headers: authHeaders() });
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || "Failed to fetch bookings");
	return data?.data || data;
}

export async function requestNameChange(bookingId, payload) {
	const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/request-name-change`, {
		method: "POST",
		headers: authHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify(payload || {}),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || "Failed to request name change");
	return data?.data || data;
}

export async function processNameChange(bookingId, payload) {
	const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/process-name-change`, {
		method: "POST",
		headers: authHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify(payload),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || "Failed to process name change");
	return data?.data || data;
}

export async function updateMarkerAmount(markerAmount) {
	const res = await fetch(`${API_BASE}/api/agent/marker-amount`, {
		method: "POST",
		headers: authHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify({ markerAmount: Number(markerAmount) }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || "Failed to update marker amount");
	return data?.data || data;
}

export async function listTickets(params = {}) {
	const url = new URL(`${API_BASE}/api/tickets`);
	Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
	const res = await fetch(url.toString(), { headers: authHeaders() });
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || "Failed to fetch tickets");
	return data?.data || data;
}

export async function getTicketById(id) {
	const res = await fetch(`${API_BASE}/api/tickets/${id}`, { headers: authHeaders() });
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || "Failed to fetch ticket");
	return data?.data || data;
}

export async function createTicket(payload) {
	const res = await fetch(`${API_BASE}/api/tickets`, {
		method: "POST",
		headers: authHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify(payload),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || "Failed to create ticket");
	return data?.data || data;
}

export async function updateTicket(id, payload) {
	const res = await fetch(`${API_BASE}/api/tickets/${id}`, {
		method: "PUT",
		headers: authHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify(payload),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || "Failed to update ticket");
	return data?.data || data;
}

export async function deleteTicket(id) {
	const res = await fetch(`${API_BASE}/api/tickets/${id}`, {
		method: "DELETE",
		headers: authHeaders(),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || "Failed to delete ticket");
	return data?.data || data;
}

export async function listAllBookings(params = {}) {
	const url = new URL(`${API_BASE}/api/bookings/admin/all`);
	Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
	const res = await fetch(url.toString(), { headers: authHeaders() });
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || "Failed to fetch bookings");
	return data?.data || data;
}


