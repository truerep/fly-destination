const nodemailer = require('nodemailer');
const Airline = require('../models/Airline');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { generateTicketPDF } = require('./pdfService');

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured');
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

function renderTicketEmailHTML({ booking, agentUser, airlineDoc, airlineLogoUrl }) {
  const t = booking.ticket || {};
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '';
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
  
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
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- Header Section -->
            <tr>
              <td style="background-color: #f97316; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin:0; font-size:24px; font-weight:700; color:#ffffff;">Flight Ticket</h1>
                <p style="margin:8px 0 0 0; font-size:16px; color:#ffedd5;">${agentUser?.companyName || 'Fly Destination'}</p>
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="margin:0 0 20px 0; font-size:20px; color:#374151;">Your Flight Ticket</h2>
                
                <p style="margin:0 0 20px 0; font-size:16px; color:#374151; line-height:1.6;">
                  Please find your flight ticket attached to this email. The PDF contains all the detailed information about your booking.
                </p>

                <!-- Basic Flight Info -->
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="margin:0 0 15px 0; font-size:18px; color:#374151;">Flight Details</h3>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 8px 0;">
                        <strong style="color:#374151;">Booking Reference:</strong> ${booking.reference}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <strong style="color:#374151;">PNR:</strong> ${booking.pnr || t.pnr || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <strong style="color:#374151;">Airline:</strong> ${t.airline || 'N/A'}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <strong style="color:#374151;">Flight:</strong> ${t.flightNumber || 'N/A'}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <strong style="color:#374151;">Route:</strong> ${t.fromAirport || ''} → ${t.toAirport || ''}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <strong style="color:#374151;">Date:</strong> ${fmtDate(t.departureTime)}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <strong style="color:#374151;">Departure:</strong> ${fmtTime(t.departureTime)} | <strong>Arrival:</strong> ${fmtTime(t.arrivalTime)}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <strong style="color:#374151;">Duration:</strong> ${getFlightDuration(t.departureTime, t.arrivalTime)}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <strong style="color:#374151;">Passengers:</strong> ${(booking.passengers || []).length} Adult(s), ${(booking.infantPassengers || []).length} Infant(s)
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <strong style="color:#374151;">Total Amount:</strong> ₹ ${Number(booking.totalSellingPrice || 0).toLocaleString()}
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Important Notice -->
                <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h3 style="margin:0 0 10px 0; font-size:16px; color:#92400e;">📎 Important</h3>
                  <p style="margin:0; font-size:14px; color:#92400e; line-height:1.5;">
                    Your complete ticket with all passenger details, baggage information, and important travel instructions is attached as a PDF file. 
                    Please download and save the attachment for your records.
                  </p>
                </div>

                <!-- Contact Info -->
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="margin:0 0 10px 0; font-size:14px; color:#6b7280;">Need help? Contact us</p>
                  <p style="margin:0; font-size:14px; color:#6b7280;">
                    Email: <a href="mailto:contact@flydestination.com" style="color:#f97316;">contact@flydestination.com</a> | 
                    Phone: <a href="tel:+911234567890" style="color:#f97316;">+91 12345 67890</a>
                  </p>
                </div>

              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

async function sendTicketEmail(bookingId, explicitTo) {
  const booking = await Booking.findById(bookingId).populate('ticket').populate('agent');
  if (!booking) throw new Error('Booking not found');
  const agentUser = await User.findById(booking.agent);
  const airlineDoc = booking.ticket?.airline ? await Airline.findOne({ name: booking.ticket.airline }) : null;
  const airlineLogoUrl = airlineDoc?.logoUrl || '';
  
  const html = renderTicketEmailHTML({ booking, agentUser, airlineDoc });
  
  // Generate PDF attachment
  let pdfBuffer = null;
  try {
    pdfBuffer = await generateTicketPDF({ booking, agentUser, airlineLogoUrl });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    // Continue without PDF if generation fails
  }
  
  const transporter = buildTransporter();
  const to = explicitTo || agentUser?.contactPersonEmail || agentUser?.email;
  const from = process.env.SMTP_FROM || `no-reply@${(process.env.SMTP_HOST || 'example.com').replace(/^smtp\./,'')}`;
  
  const mailOptions = {
    from,
    to,
    subject: `Ticket • ${booking.reference}${booking.pnr ? ` • PNR ${booking.pnr}` : ''} • PDF Attached`,
    html
  };
  
  // Add PDF attachment if generated successfully
  if (pdfBuffer) {
    mailOptions.attachments = [{
      filename: `ticket-${booking.reference}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }];
  }
  
  await transporter.sendMail(mailOptions);
}

async function sendPasswordResetEmail(email, resetURL, companyName) {
  const transporter = buildTransporter();
  const from = process.env.SMTP_FROM || `no-reply@${(process.env.SMTP_HOST || 'example.com').replace(/^smtp\./,'')}`;
  
  const html = `
  <div style="font-family: Arial, sans-serif; color:#111; background:#ffffff; padding:24px; max-width:600px; margin:0 auto;">
    <div style="text-align:center; margin-bottom:32px;">
      <div style="display:inline-block; width:60px; height:60px; background:#f97316; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:24px;">FD</div>
      <h1 style="color:#111; margin:16px 0 8px 0;">Fly Destination</h1>
      <p style="color:#6b7280; margin:0;">Password Reset Request</p>
    </div>
    
    <div style="background:#f9fafb; padding:24px; border-radius:12px; margin-bottom:24px;">
      <h2 style="color:#111; margin:0 0 16px 0; font-size:20px;">Reset Your Password</h2>
      <p style="color:#374151; margin:0 0 16px 0; line-height:1.6;">
        Hello ${companyName || 'there'},<br><br>
        We received a request to reset your password for your Fly Destination account. 
        If you didn't make this request, you can safely ignore this email.
      </p>
      
      <div style="text-align:center; margin:24px 0;">
        <a href="${resetURL}" 
           style="display:inline-block; background:#f97316; color:white; text-decoration:none; padding:12px 32px; border-radius:8px; font-weight:600; font-size:16px;">
          Reset Password
        </a>
      </div>
      
      <p style="color:#6b7280; font-size:14px; margin:16px 0 0 0; line-height:1.5;">
        This link will expire in 10 minutes for security reasons. 
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="color:#6b7280; font-size:12px; word-break:break-all; margin:8px 0 0 0;">
        ${resetURL}
      </p>
    </div>
    
    <div style="text-align:center; color:#6b7280; font-size:14px; margin-top:32px; padding-top:24px; border-top:1px solid #e5e7eb;">
      <p style="margin:0 0 8px 0;">Need help? Contact our support team</p>
      <p style="margin:0;">
        Email: <a href="mailto:contact@flydestination.com" style="color:#f97316;">contact@flydestination.com</a><br>
        Phone: <a href="tel:+911234567890" style="color:#f97316;">+91 12345 67890</a>
      </p>
    </div>
  </div>
  `;

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Reset Your Fly Destination Password',
    html
  });
}

module.exports = { sendTicketEmail, renderTicketEmailHTML, sendPasswordResetEmail };
