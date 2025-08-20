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

export async function searchTickets({ from, to, date, page = 1, limit = 10, quantity } = {}) {
	const url = new URL(`${API_BASE}/api/bookings/search`);
	url.searchParams.set("from", from);
	url.searchParams.set("to", to);
	url.searchParams.set("date", date);
	url.searchParams.set("page", String(page));
	url.searchParams.set("limit", String(limit));
	if (quantity) url.searchParams.set("quantity", String(quantity));
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

export async function getMyBookingById(id) {
  const res = await fetch(`${API_BASE}/api/bookings/${id}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to fetch booking');
  return data?.data || data;
}

export async function updateMyBookingMarkup(id, unitMarkup) {
  const res = await fetch(`${API_BASE}/api/bookings/${id}/update-markup`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ unitMarkup: Number(unitMarkup) })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to update markup');
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

export async function sendTicketEmail(bookingId, explicitTo) {
	const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/send-email`, {
		method: "POST",
		headers: authHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify({ explicitTo }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || "Failed to send ticket email");
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

// Airlines APIs
export async function listAirlines(params = {}) {
  const url = new URL(`${API_BASE}/api/airlines`);
  Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to fetch airlines');
  return data?.data || data;
}

export async function createAirline(payload) {
  const res = await fetch(`${API_BASE}/api/airlines`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to create airline');
  return data?.data || data;
}

export async function updateAirline(id, payload) {
  const res = await fetch(`${API_BASE}/api/airlines/${id}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to update airline');
  return data?.data || data;
}

export async function deleteAirline(id) {
  const res = await fetch(`${API_BASE}/api/airlines/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to delete airline');
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

// Finance APIs
export async function getMyFinance() {
	const res = await fetch(`${API_BASE}/api/finance/me`, { headers: authHeaders() });
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || 'Failed to fetch finance');
	return data?.data || data;
}

export async function listMyFinanceTransactions(params = {}) {
	const url = new URL(`${API_BASE}/api/finance/transactions`);
	Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
	const res = await fetch(url.toString(), { headers: authHeaders() });
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || 'Failed to fetch transactions');
	return data?.data || data;
}

export async function createFinanceRequest(payload) {
	const res = await fetch(`${API_BASE}/api/finance/requests`, {
		method: 'POST',
		headers: authHeaders({ 'Content-Type': 'application/json' }),
		body: JSON.stringify(payload),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || 'Failed to create request');
	return data?.data || data;
}

export async function listMyFinanceRequests(params = {}) {
	const url = new URL(`${API_BASE}/api/finance/requests`);
	Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
	const res = await fetch(url.toString(), { headers: authHeaders() });
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || 'Failed to fetch requests');
	return data?.data || data;
}

export async function listFinanceRequestsAdmin(params = {}) {
	const url = new URL(`${API_BASE}/api/finance/admin/requests`);
	Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
	const res = await fetch(url.toString(), { headers: authHeaders() });
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || 'Failed to fetch admin requests');
	return data?.data || data;
}

export async function listFinanceTransactionsAdmin(params = {}) {
	const url = new URL(`${API_BASE}/api/finance/admin/transactions`);
	Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
	const res = await fetch(url.toString(), { headers: authHeaders() });
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || 'Failed to fetch transactions');
	return data?.data || data;
}

export async function processFinanceRequest(id, payload) {
	const res = await fetch(`${API_BASE}/api/finance/admin/requests/${id}/process`, {
		method: 'POST',
		headers: authHeaders({ 'Content-Type': 'application/json' }),
		body: JSON.stringify(payload),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || 'Failed to process request');
	return data?.data || data;
}

export async function adjustAgentFinance(agentId, payload) {
	const res = await fetch(`${API_BASE}/api/finance/admin/agents/${agentId}/adjust`, {
		method: 'POST',
		headers: authHeaders({ 'Content-Type': 'application/json' }),
		body: JSON.stringify(payload),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || 'Failed to adjust finance');
	return data?.data || data;
}

export async function getReceivables() {
	const res = await fetch(`${API_BASE}/api/finance/admin/receivables`, { headers: authHeaders() });
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || 'Failed to fetch receivables');
	return data?.data || data;
}

// Promo APIs
export async function savePromo(payload) {
	const res = await fetch(`${API_BASE}/api/promos`, {
		method: 'POST',
		headers: authHeaders({ 'Content-Type': 'application/json' }),
		body: JSON.stringify(payload),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || 'Failed to save promo');
	return data?.data || data;
}

export async function togglePromo(id, isActive) {
	const res = await fetch(`${API_BASE}/api/promos/${id}/toggle`, {
		method: 'POST',
		headers: authHeaders({ 'Content-Type': 'application/json' }),
		body: JSON.stringify({ isActive }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || 'Failed to toggle promo');
	return data?.data || data;
}

export async function listMyPromos() {
	const res = await fetch(`${API_BASE}/api/promos/mine`, { headers: authHeaders() });
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || 'Failed to fetch promos');
	return data?.data || data;
}

export async function listAllPromosAdmin(params = {}) {
  const url = new URL(`${API_BASE}/api/promos`);
  Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to fetch promos');
  return data?.data || data;
}

export async function deletePromoAdmin(id) {
  const res = await fetch(`${API_BASE}/api/promos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to delete promo');
  return data?.data || data;
}

export async function searchAgents({ q = '', page = 1, limit = 10, pendingOnly = false } = {}) {
	const url = new URL(`${API_BASE}/api/users`);
	url.searchParams.set('page', String(page));
	url.searchParams.set('limit', String(limit));
	url.searchParams.set('userType', 'agent');
	if (pendingOnly) url.searchParams.set('isApproved', 'false');
	if (q) url.searchParams.set('search', q);
	const res = await fetch(url.toString(), { headers: authHeaders() });
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || 'Failed to fetch agents');
	const items = data?.data?.items || data?.data?.users || [];
	return items;
}

export async function listCalendarTickets({ start, end, from, to, airline } = {}) {
	const url = new URL(`${API_BASE}/api/bookings/calendar`);
	if (start) url.searchParams.set('start', start);
	if (end) url.searchParams.set('end', end);
	if (from) url.searchParams.set('from', from);
	if (to) url.searchParams.set('to', to);
	if (airline) url.searchParams.set('airline', airline);
	const res = await fetch(url.toString(), { headers: authHeaders() });
	const data = await res.json();
	if (!res.ok) throw new Error(data?.message || 'Failed to fetch calendar tickets');
	return data?.data || data;
}


