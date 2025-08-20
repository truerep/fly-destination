"use client";

import "./styles.css";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getMyBookingById, updateMyBookingMarkup, getProfile, listAirlines, sendTicketEmail } from "@/lib/api";
import { toast } from "sonner";
import Head from "next/head";
import { formatDate, formatTime, getFlightDuration } from "@/utils";

export default function PrintBookingPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [unitMarkup, setUnitMarkup] = useState(0);
  const [profile, setProfile] = useState(null);
  const [airlineLogoUrl, setAirlineLogoUrl] = useState("");

  async function load() {
    setLoading(true);
    try {
      const b = await getMyBookingById(bookingId);
      setBooking(b);
      setUnitMarkup(Number(b?.unitMarkup || 0));
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { if (bookingId) load(); /* eslint-disable-next-line */ }, [bookingId]);

  useEffect(() => {
    (async () => {
      try {
        const p = await getProfile();
        setProfile(p?.user || p);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const airlineName = (booking?.ticket?.airline || '').trim();
        if (!airlineName) return;
        const data = await listAirlines({ q: airlineName, isActive: true, page: 1, limit: 5 });
        const items = data?.items || data?.airlines || data || [];
        const match = (items || []).find(a => (a.name || '').toLowerCase() === airlineName.toLowerCase()) || (items || [])[0];
        if (match?.logoUrl) setAirlineLogoUrl(match.logoUrl);
      } catch {}
    })();
  }, [booking]);

  const totals = useMemo(() => {
    const qty = Number(booking?.quantity || 0);
    const infants = Number(booking?.infants || 0);
    const unitBase = Number(booking?.unitBasePrice || 0);
    const uMarkup = Number(unitMarkup || 0);
    const unitSell = unitBase + uMarkup;
    const totalBase = unitBase * qty;
    const totalMarkup = uMarkup * qty;
    let totalSell = unitSell * qty;
    if (infants > 0) totalSell += 2000 * infants;
    return { unitSell, totalBase, totalMarkup, totalSell };
  }, [booking, unitMarkup]);

  async function saveMarkup() {
    try {
      await updateMyBookingMarkup(bookingId, unitMarkup);
      toast.success("Markup updated");
      load();
    } catch (e) { toast.error(e.message); }
  }

  async function handleSendEmail() {
    setSendingEmail(true);
    try {
      await sendTicketEmail(bookingId);
      toast.success("Ticket email sent successfully!");
    } catch (e) { 
      toast.error(e.message); 
    } finally {
      setSendingEmail(false);
    }
  }

  if (!booking) return null;

  return (
    <div className="space-y-6">
      <Card className="print-none">
        <CardHeader>
          <CardTitle>Print Ticket • {booking.reference}</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Route</div>
            <div className="font-medium">{booking.fromAirportCity || booking.ticket?.fromAirport} → {booking.toAirportCity || booking.ticket?.toAirport}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Quantity</div>
            <div className="font-medium">{booking.quantity}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Infants</div>
            <div className="font-medium">{booking.infants}</div>
          </div>
        </CardContent>
      </Card>


      <Card className="print-none">
        <CardHeader>
          <CardTitle>Markup & Totals</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4 items-end">
          <div>
            <div className="text-sm text-muted-foreground">Unit Base</div>
            <div className="font-medium">₹ {Number(booking.unitBasePrice || 0).toLocaleString()}</div>
          </div>
          <div>
            <label className="text-sm">Unit Markup</label>
            <Input type="number" min={0} value={unitMarkup} onChange={(e) => setUnitMarkup(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total Base</div>
            <div className="font-medium">₹ {Number(totals.totalBase).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total Markup</div>
            <div className="font-medium">₹ {Number(totals.totalMarkup).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total Selling</div>
            <div className="font-medium">₹ {Number(totals.totalSell).toLocaleString()}</div>
          </div>
          <div>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={saveMarkup}>Save Markup</Button>
          </div>
          <div>
            <Button variant="outline" onClick={() => {document.title = 'Ticket'; window.print()}}>Print</Button>
          </div>
          <div>
            <Button 
              className="bg-orange-600 hover:bg-orange-700" 
              onClick={handleSendEmail}
              disabled={sendingEmail}
            >
              {sendingEmail ? "Sending..." : "Send Mail (with PDF)"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div id="printContainer" class="font-sans">
        <div class="flex justify-center">
          <div class="ticket bg-white overflow-hidden border-gray-100">

            <div class="bg-gradient-to-r from-airline-primary to-airline-secondary p-6">
              <div class="flex justify-between items-center">
                <div class="flex items-center space-x-4">
                  <div class="rounded-md overflow-hidden">
                    {profile?.profileImageUrl ? (
                      <img src={profile.profileImageUrl} alt="agent" style={{ height: 50 }} />
                    ) : null}
                  </div>
                  <div>
                    <h2 class="text-white font-bold text-lg">{profile?.companyName || ''}</h2>
                    <p class="text-airline-light text-sm">{profile?.contactPersonEmail || profile?.email || ''} | {profile?.phoneNumber || ''}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-4">
                  <div class="rounded-md overflow-hidden">
                    {airlineLogoUrl ? (
                      <img src={airlineLogoUrl} alt="airline" style={{ height: 50 }} />
                    ) : null}
                  </div>
                  <div class="text-right text-white">
                    <p class="font-bold text-white uppercase">{booking.ticket?.airline || 'AIRLINE'}</p>
                    <p class="text-sm text-airline-light">{booking.ticket?.flightNumber || 'FLIGHT'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* <div class="p-6">
                    <h1 class="text-3xl font-bold text-gray-900 font-display tracking-tight mb-0">TICKET DETAILS</h1>
                </div>  */}

            {/* <div class="p-6 border-b border-gray-200 grid grid-cols-3 gap-4"> */}
            <div class="p-6 border-b border-gray-200 flex gap-4 justify-between">
              <div>
                <p class="text-xs text-gray-500 font-medium">Reference</p>
                <p class="font-medium text-lg">{booking.reference}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 font-medium">PNR</p>
                <p class="font-medium text-lg">{booking.pnr || booking.ticket?.pnr || '-'}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 font-medium">Booking Date</p>
                <p class="font-medium text-lg">{booking.createdAt ? formatDate(booking.createdAt) : ''}</p>
              </div>
            </div>

            <div class="p-6 pt-0">
              <div class="flight-path relative py-6">
                <div class="grid grid-cols-2">
                  <div>
                    <p class="text-3xl font-bold font-display">{booking.ticket?.fromAirport}</p>
                    <p class="text-gray-600">{booking.fromAirportCity || booking.ticket?.fromAirport}</p>
                    <p class="text-gray-900 font-medium mt-3">
                      {booking.ticket?.departureTime ? formatDate(booking.ticket.departureTime) : ''}
                    </p>
                    <p class="text-2xl font-bold">
                      {booking.ticket?.departureTime ? formatTime(booking.ticket.departureTime) : ''}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-3xl font-bold font-display">{booking.ticket?.toAirport}</p>
                    <p class="text-gray-600">{booking.toAirportCity || booking.ticket?.toAirport}</p>
                    <p class="text-gray-900 font-medium mt-3">
                      {booking.ticket?.arrivalTime ? formatDate(booking.ticket.arrivalTime) : ''}
                    </p>
                    <p class="text-2xl font-bold">
                      {booking.ticket?.arrivalTime ? formatTime(booking.ticket.arrivalTime) : ''}
                    </p>
                  </div>
                </div>
              </div>
              <div class="text-center text-gray-500 text-sm mb-8">Duration: {getFlightDuration(booking.ticket.departureTime, booking.ticket.arrivalTime)}</div>

              <div class="mb-8">
                <h3 class="text-lg font-semibold text-gray-700 mb-4">PASSENGERS</h3>
                <div class="space-y-3">
                  <div class="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium pb-2 border-b">
                    <div class="col-span-4 ps-3">Name</div>
                    <div class="col-span-2 ps-2">Type</div>
                    <div class="col-span-2">Cabin Baggage</div>
                    <div class="col-span-2">Check-in Baggage</div>
                    <div class="col-span-2">Date of Birth</div>
                  </div>

                  {(booking.passengers || []).map((p, idx) => (
                    <div key={idx} class="grid grid-cols-12 gap-2 items-center py-3 passenger-card bg-gray-50 pl-2 rounded-lg">
                      <div class="col-span-4 font-medium">{[p.salutation, p.firstName, p.lastName].filter(Boolean).join(' ')}</div>
                      <div class="col-span-2">
                        <span class="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs">{p.type?.toUpperCase() || 'ADULT'}</span>
                      </div>
                      <div class="col-span-2 text-sm">1 × {booking.ticket?.cabinBagWeight || 7}kg</div>
                      <div class="col-span-2 text-sm">1 × {booking.ticket?.checkinBagWeight || 15}kg</div>
                      <div class="col-span-2 text-sm">{p.dateOfBirth ? formatDate(p.dateOfBirth) : '-'}</div>
                    </div>
                  ))}
                  {(booking.infantPassengers || []).map((ip, idx) => (
                    <div key={`infant-${idx}`} class="grid grid-cols-12 gap-2 items-center py-3 passenger-card bg-gray-50 pl-2 rounded-lg">
                      <div class="col-span-4 font-medium">{[ip.salutation, ip.firstName, ip.lastName].filter(Boolean).join(' ')}</div>
                      <div class="col-span-2">
                        <span class="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs">INFANT</span>
                      </div>
                      <div class="col-span-2 text-sm">{booking.ticket?.infantCabinBagWeight > 0 ? `1 × ${booking.ticket?.infantCabinBagWeight}kg` : '-'}</div>
                      <div class="col-span-2 text-sm">{booking.ticket?.infantCheckinBagWeight > 0 ? `1 × ${booking.ticket?.infantCheckinBagWeight}kg` : '-'}</div>
                      <div class="col-span-2 text-sm">{ip.dateOfBirth ? formatDate(ip.dateOfBirth) : '-'}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div class="mb-8 bg-airline-light font-semibold p-4 rounded-lg">
                <h3 class="text-lg text-gray-800 mb-3">BILLING</h3>
                <div class="flex justify-between items-center">
                  <div>
                    <p class="text-gray-600">Total Amount</p>
                    <p class="text-xs text-gray-500">Inclusive of all taxes</p>
                  </div>
                  <div class="text-right">
                    <p class="text-2xl font-bold text-airline-primary">₹ {Number(booking.totalSellingPrice || 0).toLocaleString()}</p>
                    <p class="text-xs text-gray-500">INR</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">IMPORTANT INSTRUCTIONS AND FAIR RULE FOR TRAVELLERS</h3>
                <ul class="space-y-2 text-sm">
                  <li class="flex items-start">
                    <div class="flex-shrink-0 h-5 w-5 text-airline-primary mr-2">•</div>
                    <span>Please carry a Valid Photo Identity Proof.</span>
                  </li>
                  <li class="flex items-start">
                    <div class="flex-shrink-0 h-5 w-5 text-airline-primary mr-2">•</div>
                    <span>Check-in counter closes strictly 60-mins prior departure time. Please Check-in atleast 2.5 Hrs prior departure time.</span>
                  </li>
                  <li class="flex items-start">
                    <div class="flex-shrink-0 h-5 w-5 text-airline-primary mr-2">•</div>
                    <span>Delay & Cancellation of Flights are out of our or airline's control. Please get in touch with Airline Staffs for alternate arrangements or alternate date on same airline. Please provide active & correct contact numbers to keep you updated about flight schedules. Agency or Airline shall not be responsible for any inconvenience if you are unreachable or have provided incorrect mobile number.</span>
                  </li>
                  <li class="flex items-start">
                    <div class="flex-shrink-0 h-5 w-5 text-airline-primary mr-2">•</div>
                    <span>This is Group Fare Booking. Non-Cancellable and Non-Changeable.</span>
                  </li>
                  <li class="flex items-start">
                    <div class="flex-shrink-0 h-5 w-5 text-airline-primary mr-2">•</div>
                    <span>Fare once booked, cannot be discounted further even if system fare reduces & is an agreement between buyer-seller.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}


