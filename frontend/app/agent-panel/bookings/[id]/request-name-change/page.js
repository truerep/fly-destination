"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getMyBookingById, requestNameChange } from "@/lib/api";
import { toast } from "sonner";

export default function RequestNameChangePage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id;
  const [booking, setBooking] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    (async () => {
      try {
        const b = await getMyBookingById(bookingId);
        setBooking(b);
        const p = (b?.passengers || []).map(p => ({ firstName: p.firstName || '', lastName: p.lastName || '', salutation: p.salutation || 'Mr', type: p.type || 'adult' }));
        setPassengers(p);
      } catch (e) { toast.error(e.message); }
    })();
  }, [bookingId]);

  async function submit() {
    if (!booking) return;
    setLoading(true);
    try {
      await requestNameChange(bookingId, { passengers });
      toast.success('Request submitted');
      router.push('/agent-panel/bookings');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  if (!booking) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Name Change • {booking.reference}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(passengers || []).map((p, idx) => (
          <div key={idx} className="grid gap-2 md:grid-cols-3">
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
          </div>
        ))}
        <div className="flex gap-2">
          <Button className="bg-orange-600 hover:bg-orange-700" disabled={loading} onClick={submit}>{loading ? 'Submitting...' : 'Submit Request'}</Button>
          <Button variant="outline" onClick={() => router.push('/agent-panel/bookings')}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}


