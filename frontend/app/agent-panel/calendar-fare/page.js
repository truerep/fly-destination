"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listCalendarTickets } from "@/lib/api";
import Link from "next/link";

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export default function CalendarFarePage() {
  const [cursor, setCursor] = useState(() => new Date());
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [airline, setAirline] = useState("");

  const monthStart = useMemo(() => startOfMonth(cursor), [cursor]);
  const monthEnd = useMemo(() => endOfMonth(cursor), [cursor]);

  async function load() {
    setLoading(true);
    try {
      const data = await listCalendarTickets({
        start: monthStart.toISOString(),
        end: monthEnd.toISOString(),
        from: from || undefined,
        to: to || undefined,
        airline: airline || undefined,
      });
      setTickets(data?.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [cursor]);

  const days = useMemo(() => {
    const firstWeekday = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1).getDay();
    const daysInMonth = endOfMonth(monthStart).getDate();
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), d));
    return cells;
  }, [monthStart]);

  function groupByDate(items) {
    const map = new Map();
    for (const t of items) {
      const key = new Date(t.departureTime).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    return map;
  }

  const grouped = useMemo(() => groupByDate(tickets), [tickets]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Calendar Fare</span>
          <div className="flex items-center gap-2">
            <Input placeholder="From (IATA)" className="w-28" value={from} onChange={(e) => setFrom(e.target.value.toUpperCase())} />
            <Input placeholder="To (IATA)" className="w-28" value={to} onChange={(e) => setTo(e.target.value.toUpperCase())} />
            <Input placeholder="Airline" className="w-36" value={airline} onChange={(e) => setAirline(e.target.value)} />
            <Button variant="outline" onClick={() => load()} disabled={loading}>Filter</Button>
            <Button variant="outline" onClick={() => { setFrom(""); setTo(""); setAirline(""); load(); }}>Reset</Button>
            <Button variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>Prev</Button>
            <div className="text-sm w-40 text-center">{cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
            <Button variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>Next</Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-xs text-muted-foreground text-center">{d}</div>
          ))}
          {days.map((day, idx) => (
            <div key={idx} className="min-h-36 border rounded p-2 space-y-2">
              <div className="text-xs font-medium">{day ? day.getDate() : ''}</div>
              <div className="space-y-1">
                {day && (grouped.get(day.toDateString()) || []).map(t => (
                  <Link key={t._id} href={`/agent-panel/book/${t._id}`} className="block border rounded p-1 text-xs hover:bg-orange-50">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t.fromAirport} → {t.toAirport}</span>
                      <span>₹ {Number(t.basePrice).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{t.airline} {t.flightNumber}</span>
                      <span>Seats: {t.quantityAvailable}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


