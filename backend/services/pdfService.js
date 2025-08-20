const puppeteer = require('puppeteer');

function generateTicketHTML({ booking, agentUser, airlineLogoUrl }) {
  const t = booking.ticket || {};
  const passengers = booking.passengers || [];
  const infantPassengers = booking.infantPassengers || [];
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '';
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
  const agentImage = agentUser?.profileImageUrl || '';
  const airlineLogo = airlineLogoUrl || '';
  
  // Calculate flight duration
  const getFlightDuration = (departure, arrival) => {
    if (!departure || !arrival) return '';
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const diff = arr - dep;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flight Ticket - ${booking.reference}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', sans-serif;
        color: #000;
        background: #ffffff;
      }
      
      .ticket {
        background: white;
        color: #000;
        font-family: 'Inter', sans-serif;
      }
      
      .header {
        background: linear-gradient(to right, #f97316, #ea580c);
        padding: 24px;
        color: white;
      }
      
      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .agent-info {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .agent-image {
        width: 50px;
        height: 50px;
        border-radius: 8px;
        object-fit: cover;
      }
      
      .agent-details h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: white;
      }
      
      .agent-details p {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: #ffedd5;
      }
      
      .airline-info {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .airline-logo {
        height: 50px;
        object-fit: contain;
      }
      
      .airline-details {
        text-align: right;
        color: white;
      }
      
      .airline-details p:first-child {
        margin: 0;
        font-weight: 700;
        font-size: 16px;
        text-transform: uppercase;
      }
      
      .airline-details p:last-child {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: #ffedd5;
      }
      
      .booking-info {
        padding: 24px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .booking-item {
        text-align: center;
      }
      
      .booking-item p:first-child {
        margin: 0;
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
      }
      
      .booking-item p:last-child {
        margin: 4px 0 0 0;
        font-size: 18px;
        font-weight: 600;
        color: #000000;
      }
      
      .flight-route {
        padding: 24px;
        position: relative;
      }
      
      .flight-path {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        position: relative;
        padding: 24px 0;
      }
      
      .flight-path::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #f97316, transparent);
        transform: translateY(-50%);
      }
      
      .flight-path::after {
        content: "✈";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #f97316;
        font-size: 1.5rem;
      }
      
      .departure, .arrival {
        position: relative;
        z-index: 1;
      }
      
      .arrival {
        text-align: right;
      }
      
      .airport-code {
        margin: 0;
        font-size: 32px;
        font-weight: 700;
        font-family: 'Space Grotesk', sans-serif;
        color: #000000;
      }
      
      .airport-city {
        margin: 4px 0 0 0;
        font-size: 16px;
        color: #6b7280;
      }
      
      .flight-date {
        margin: 12px 0 0 0;
        font-size: 16px;
        font-weight: 600;
        color: #000000;
      }
      
      .flight-time {
        margin: 4px 0 0 0;
        font-size: 24px;
        font-weight: 700;
        color: #000000;
      }
      
      .duration {
        text-align: center;
        color: #6b7280;
        font-size: 14px;
        margin-top: 16px;
      }
      
      .passengers-section {
        padding: 0 24px 24px;
      }
      
      .section-title {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 600;
        color: #374151;
      }
      
      .passenger-header {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
        gap: 8px;
        padding: 8px 12px;
        background: #f9fafb;
        border-radius: 8px;
        margin-bottom: 10px;
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
      }
      
      .passenger-row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
        gap: 8px;
        padding: 12px;
        background: #f9fafb;
        border-radius: 8px;
        margin-bottom: 8px;
        border-left: 4px solid #f97316;
      }
      
      .passenger-name {
        font-weight: 600;
        color: #000000;
      }
      
      .passenger-type {
        background: #e5e7eb;
        color: #374151;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        text-transform: uppercase;
        display: inline-block;
      }
      
      .passenger-baggage {
        font-size: 14px;
        color: #000000;
      }
      
      .billing-section {
        background: #ffedd5;
        padding: 24px;
        border-radius: 8px;
        margin: 24px;
      }
      
      .billing-title {
        margin: 0 0 15px 0;
        font-size: 18px;
        font-weight: 600;
        color: #374151;
      }
      
      .billing-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .billing-left p:first-child {
        margin: 0;
        color: #6b7280;
      }
      
      .billing-left p:last-child {
        margin: 4px 0 0 0;
        font-size: 12px;
        color: #6b7280;
      }
      
      .billing-right {
        text-align: right;
      }
      
      .billing-right p:first-child {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        color: #f97316;
      }
      
      .billing-right p:last-child {
        margin: 4px 0 0 0;
        font-size: 12px;
        color: #6b7280;
      }
      
      .promo-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .promo-left p:first-child {
        margin: 0;
        color: #6b7280;
      }
      
      .promo-left p:last-child {
        margin: 4px 0 0 0;
        font-size: 12px;
        color: #6b7280;
      }
      
      .promo-right {
        text-align: right;
      }
      
      .promo-right p:first-child {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #059669;
      }
      
      .promo-right p:last-child {
        margin: 4px 0 0 0;
        font-size: 12px;
        color: #6b7280;
      }
      
      .instructions-section {
        padding: 0 24px 24px;
      }
      
      .instructions-title {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 600;
        color: #374151;
      }
      
      .instructions-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .instructions-list li {
        display: flex;
        align-items: start;
        margin-bottom: 10px;
      }
      
      .instructions-list li:last-child {
        margin-bottom: 0;
      }
      
      .instructions-list li::before {
        content: "•";
        color: #f97316;
        font-weight: bold;
        font-size: 16px;
        margin-right: 10px;
        flex-shrink: 0;
      }
      
      .instructions-list li span {
        font-size: 14px;
        color: #000000;
      }
    </style>
  </head>
  <body>
    <div class="ticket">
      <!-- Header Section -->
      <div class="header">
        <div class="header-content">
          <div class="agent-info">
            ${agentImage ? `<img src="${agentImage}" alt="agent" class="agent-image"/>` : ''}
            <div class="agent-details">
              <h2>${agentUser?.companyName || ''}</h2>
              <p>${agentUser?.contactPersonEmail || agentUser?.email || ''} | ${agentUser?.phoneNumber || ''}</p>
            </div>
          </div>
          <div class="airline-info">
            ${airlineLogo ? `<img src="${airlineLogo}" alt="airline" class="airline-logo"/>` : ''}
            <div class="airline-details">
              <p>${t.airline || 'AIRLINE'}</p>
              <p>${t.flightNumber || 'FLIGHT'}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Booking Reference Section -->
      <div class="booking-info">
        <div class="booking-item">
          <p>Reference</p>
          <p>${booking.reference}</p>
        </div>
        <div class="booking-item">
          <p>PNR</p>
          <p>${booking.pnr || t.pnr || '-'}</p>
        </div>
        <div class="booking-item">
          <p>Booking Date</p>
          <p>${fmtDate(booking.createdAt)}</p>
        </div>
      </div>

      <!-- Flight Route Section -->
      <div class="flight-route">
        <div class="flight-path">
          <div class="departure">
            <p class="airport-code">${t.fromAirport || ''}</p>
            <p class="airport-city">${booking.fromAirportCity || t.fromAirport || ''}</p>
            <p class="flight-date">${fmtDate(t.departureTime)}</p>
            <p class="flight-time">${fmtTime(t.departureTime)}</p>
          </div>
          <div class="arrival">
            <p class="airport-code">${t.toAirport || ''}</p>
            <p class="airport-city">${booking.toAirportCity || t.toAirport || ''}</p>
            <p class="flight-date">${fmtDate(t.arrivalTime)}</p>
            <p class="flight-time">${fmtTime(t.arrivalTime)}</p>
          </div>
        </div>
        <div class="duration">Duration: ${getFlightDuration(t.departureTime, t.arrivalTime)}</div>
      </div>

      <!-- Passengers Section -->
      <div class="passengers-section">
        <h3 class="section-title">PASSENGERS</h3>
        
        <div class="passenger-header">
          <div>Name</div>
          <div>Type</div>
          <div>Cabin Baggage</div>
          <div>Check-in Baggage</div>
          <div>Date of Birth</div>
        </div>
        
        ${passengers.map(p => `
          <div class="passenger-row">
            <div class="passenger-name">${[p.salutation, p.firstName, p.lastName].filter(Boolean).join(' ')}</div>
            <div><span class="passenger-type">${p.type || 'adult'}</span></div>
            <div class="passenger-baggage">1 × ${t.cabinBagWeight || 7}kg</div>
            <div class="passenger-baggage">1 × ${t.checkinBagWeight || 15}kg</div>
            <div class="passenger-baggage">${p.dateOfBirth ? fmtDate(p.dateOfBirth) : '-'}</div>
          </div>
        `).join('')}
        
        ${infantPassengers.map(ip => `
          <div class="passenger-row">
            <div class="passenger-name">${[ip.salutation, ip.firstName, ip.lastName].filter(Boolean).join(' ')}</div>
            <div><span class="passenger-type">infant</span></div>
            <div class="passenger-baggage">${t.infantCabinBagWeight > 0 ? `1 × ${t.infantCabinBagWeight}kg` : '-'}</div>
            <div class="passenger-baggage">${t.infantCheckinBagWeight > 0 ? `1 × ${t.infantCheckinBagWeight}kg` : '-'}</div>
            <div class="passenger-baggage">${ip.dateOfBirth ? fmtDate(ip.dateOfBirth) : '-'}</div>
          </div>
        `).join('')}
      </div>

      <!-- Billing Section -->
      <div class="billing-section">
        <h3 class="billing-title">BILLING</h3>
        ${booking.promoCode ? `
          <div class="promo-section">
            <div class="promo-left">
              <p>Promo Code Applied</p>
              <p>${booking.promoCode}</p>
            </div>
            <div class="promo-right">
              <p>- ₹ ${Number(booking.promoDiscount || 0).toLocaleString()}</p>
              <p>Discount Applied</p>
            </div>
          </div>
        ` : ''}
        <div class="billing-content">
          <div class="billing-left">
            <p>Total Amount</p>
            <p>Inclusive of all taxes</p>
          </div>
          <div class="billing-right">
            <p>₹ ${Number(booking.totalSellingPrice || 0).toLocaleString()}</p>
            <p>INR</p>
          </div>
        </div>
      </div>

      <!-- Important Instructions -->
      <div class="instructions-section">
        <h3 class="instructions-title">IMPORTANT INSTRUCTIONS AND FAIR RULE FOR TRAVELLERS</h3>
        <ul class="instructions-list">
          <li><span>Please carry a Valid Photo Identity Proof.</span></li>
          <li><span>Check-in counter closes strictly 60-mins prior departure time. Please Check-in atleast 2.5 Hrs prior departure time.</span></li>
          <li><span>Delay & Cancellation of Flights are out of our or airline's control. Please get in touch with Airline Staffs for alternate arrangements or alternate date on same airline. Please provide active & correct contact numbers to keep you updated about flight schedules. Agency or Airline shall not be responsible for any inconvenience if you are unreachable or have provided incorrect mobile number.</span></li>
          <li><span>This is Group Fare Booking. Non-Cancellable and Non-Changeable.</span></li>
          <li><span>Fare once booked, cannot be discounted further even if system fare reduces & is an agreement between buyer-seller.</span></li>
        </ul>
      </div>
    </div>
  </body>
  </html>
  `;
}

async function generateTicketPDF({ booking, agentUser, airlineLogoUrl }) {
  console.log('PDF Service: Starting PDF generation for booking:', booking.reference);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport for A4 size
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      deviceScaleFactor: 2 // Higher resolution for better quality
    });
    
    const html = generateTicketHTML({ booking, agentUser, airlineLogoUrl });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Wait a bit for fonts to render properly
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate PDF
    console.log('PDF Service: Generating PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });
    
    console.log('PDF Service: PDF generated successfully, size:', pdf.length);
    return pdf;
  } catch (error) {
    console.error('PDF Service: Error generating PDF:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = { generateTicketPDF, generateTicketHTML };
