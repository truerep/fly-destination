"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getTicketById, createBooking, getProfile, listMyPromos } from "@/lib/api";
import { toast } from "sonner";

export default function PassengerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params?.id;
  const [ticket, setTicket] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [infants, setInfants] = useState(0);
  const [infantPassengers, setInfantPassengers] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [promoList, setPromoList] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [markerEditing, setMarkerEditing] = useState('');

  useEffect(() => {
    if (!ticketId) return;
    (async () => {
      try {
        const t = await getTicketById(ticketId);
        setTicket(t?.ticket || t);
        const p = await getProfile();
        setProfile(p?.user || p);
        setMarkerEditing(String(p?.user?.markerAmount ?? p?.markerAmount ?? 0));
        const promos = await listMyPromos();
        setPromoList(promos?.items || []);
        setPassengers(Array.from({ length: 1 }, () => ({ firstName: "", lastName: "", salutation: "Mr", type: "adult" })));
      } catch (e) { toast.error(e.message); }
    })();
  }, [ticketId]);

  useEffect(() => {
    setPassengers(Array.from({ length: quantity }, () => ({ firstName: "", lastName: "", salutation: "Mr", type: "adult" })));
  }, [quantity]);

  useEffect(() => {
    const count = Math.max(0, Number(infants || 0));
    setInfantPassengers(Array.from({ length: count }, () => ({ firstName: "", lastName: "", salutation: "Mstr", dateOfBirth: "" })));
  }, [infants]);

  const unitSellingPrice = useMemo(() => {
    if (!ticket || !profile) return 0;
    return Number(ticket.basePrice || 0) + Number(profile.markerAmount || 0);
  }, [ticket, profile]);

  const baseUnit = Number(ticket?.basePrice || 0);
  const markerUnit = Number(profile?.markerAmount || 0);
  const baseSubtotal = useMemo(() => baseUnit * Number(quantity || 0), [baseUnit, quantity]);
  const markerSubtotal = useMemo(() => markerUnit * Number(quantity || 0), [markerUnit, quantity]);
  const infantsSubtotal = useMemo(() => Number(ticket?.infantPrice || 0) * Number(infants || 0), [infants, ticket]);
  const currentPromo = useMemo(() => (promoList || []).find(p => (p.code || '').toUpperCase() === (promoCode || '').toUpperCase()) || null, [promoList, promoCode]);
  const estimatedDiscount = useMemo(() => {
    if (!currentPromo) return 0;
    const beforeInfants = baseSubtotal + markerSubtotal;
    let d = 0;
    if (currentPromo.isPercent) {
      d = beforeInfants * Number(currentPromo.amount || 0) / 100;
      if (typeof currentPromo.maxDiscount === 'number') {
        d = Math.min(d, Number(currentPromo.maxDiscount));
      }
    } else {
      d = Number(currentPromo.amount || 0);
    }
    d = Math.max(0, Math.min(d, beforeInfants));
    return d;
  }, [currentPromo, baseSubtotal, markerSubtotal]);
  const totalSelling = useMemo(() => (baseSubtotal + markerSubtotal - estimatedDiscount) + infantsSubtotal, [baseSubtotal, markerSubtotal, estimatedDiscount, infantsSubtotal]);

  async function submitBooking() {
    if (!ticket) return;
    setLoading(true);
    try {
      const payload = { ticketId, quantity: Number(quantity), infants: Number(infants || 0), infantPassengers, passengers, promoCode: promoCode || undefined };
      const data = await createBooking(payload);
      toast.success("Booking created");
      router.push("/agent-panel/bookings");
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passenger Details & Confirm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <div className="font-medium">{ticket?.airline} • {ticket?.flightNumber}</div>
          <div>{ticket?.fromAirport} → {ticket?.toAirport}</div>
          <div className="mt-1">Base Price: <strong>₹ {Number(ticket?.basePrice || 0).toLocaleString()}</strong></div>
          <div className="mt-1">Infant Price: <strong>₹ {Number(ticket?.infantPrice || 0).toLocaleString()}</strong></div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Quantity</Label>
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))} />
          </div>
          <div>
            <Label>Infants</Label>
            <Input type="number" min={0} value={infants} onChange={(e) => setInfants(Math.max(0, Number(e.target.value || 0)))} />
            <div className="text-xs text-muted-foreground mt-1">Infant fee: ₹ {Number(ticket?.infantPrice || 0).toLocaleString()} per infant</div>
          </div>
          <div className="self-end text-sm text-muted-foreground">Prices update as you change quantity/marker/infants</div>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <div>
            <Label>Marker Amount (₹)</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} value={markerEditing} onChange={(e) => setMarkerEditing(e.target.value)} />
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const { updateMarkerAmount, getProfile } = await import("@/lib/api");
                    await updateMarkerAmount(Math.max(0, Number(markerEditing || 0)));
                    const fresh = await getProfile();
                    setProfile(fresh?.user || fresh);
                    toast.success('Marker updated');
                  } catch (e) { toast.error(e.message); }
                }}
              >Save</Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Your sell price = base + marker</div>
          </div>
        </div>

        {Number(infants) > 0 && (
          <div className="space-y-3">
            <div className="font-medium">Infant Details</div>
            {infantPassengers.map((ip, idx) => (
              <div key={idx} className="grid gap-2 md:grid-cols-4">
                <div>
                  <Label>First Name</Label>
                  <Input value={ip.firstName} onChange={(e) => setInfantPassengers(prev => prev.map((x, i) => i === idx ? { ...x, firstName: e.target.value } : x))} />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={ip.lastName} onChange={(e) => setInfantPassengers(prev => prev.map((x, i) => i === idx ? { ...x, lastName: e.target.value } : x))} />
                </div>
                <div>
                  <Label>Salutation</Label>
                  <select className="border rounded h-9 w-full px-2" value={ip.salutation} onChange={(e) => setInfantPassengers(prev => prev.map((x, i) => i === idx ? { ...x, salutation: e.target.value } : x))}>
                    <option value="Mstr">Mstr</option>
                    <option value="Miss">Miss</option>
                  </select>
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={ip.dateOfBirth} onChange={(e) => setInfantPassengers(prev => prev.map((x, i) => i === idx ? { ...x, dateOfBirth: e.target.value } : x))} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-2 md:grid-cols-3">
          <div>
            <Label>Promo Code (optional)</Label>
            <Input list="promo-codes" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="CODE123" />
            <datalist id="promo-codes">
              {promoList.map(p => <option key={p._id} value={p.code} />)}
            </datalist>
          </div>
        </div>

        <div className="rounded-md border p-4 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>Base (admin) × {quantity}</div>
            <div>₹ {baseSubtotal.toLocaleString()}</div>
          </div>
          <div className="flex items-center justify-between">
            <div>Marker × {quantity}</div>
            <div>₹ {markerSubtotal.toLocaleString()}</div>
          </div>
          {estimatedDiscount > 0 && (
            <div className="flex items-center justify-between text-green-700">
              <div>Promo discount</div>
              <div>- ₹ {estimatedDiscount.toLocaleString()}</div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>Infant fee (₹{Number(ticket?.infantPrice || 0).toLocaleString()} × {Number(infants || 0)})</div>
            <div>₹ {infantsSubtotal.toLocaleString()}</div>
          </div>
          <div className="border-t my-2" />
          <div className="flex items-center justify-between font-medium">
            <div>Total</div>
            <div>₹ {totalSelling.toLocaleString()}</div>
          </div>
        </div>

        <div className="space-y-3">
          {passengers.map((p, idx) => (
            <div key={idx} className="grid gap-2 md:grid-cols-4">
              <div>
                <Label>First Name</Label>
                <Input value={p.firstName} onChange={(e) => setPassengers(prev => prev.map((x, i) => i === idx ? { ...x, firstName: e.target.value } : x))} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={p.lastName} onChange={(e) => setPassengers(prev => prev.map((x, i) => i === idx ? { ...x, lastName: e.target.value } : x))} />
              </div>
              <div>
                <Label>Salutation</Label>
                <select className="border rounded h-9 w-full px-2" value={p.salutation} onChange={(e) => setPassengers(prev => prev.map((x, i) => i === idx ? { ...x, salutation: e.target.value } : x))}>
                  <option value="Mr">Mr</option>
                  <option value="Ms">Ms</option>
                  <option value="Mrs">Mrs</option>
                </select>
              </div>
              <div>
                <Label>Type</Label>
                <select className="border rounded h-9 w-full px-2" value={p.type} onChange={(e) => setPassengers(prev => prev.map((x, i) => i === idx ? { ...x, type: e.target.value } : x))}>
                  <option value="adult">Adult</option>
                  <option value="child">Child</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button className="bg-orange-600 hover:bg-orange-700" disabled={loading} onClick={submitBooking}>{loading ? 'Submitting...' : 'Confirm Booking'}</Button>
          <Button variant="outline" onClick={() => router.push('/agent-panel/book')}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}


