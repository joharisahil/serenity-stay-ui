import { PLAN_NAMES } from './invoiceConstants';

export const fmt = (n?: number) =>
  (typeof n === "number" ? n : 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
export function buildGuestAndCompanySection(booking: any) {
  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);

  const nights = Math.max(
    1,
    Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const stayDetailsSection = `
  <div class="section">
    <div class="section-title">Stay Details</div>
    <div class="info-grid">
      <div><strong>Check-in:</strong> ${checkIn.toLocaleString("en-IN")}</div>
      <div><strong>Check-out:</strong> ${checkOut.toLocaleString("en-IN")}</div>
      <div><strong>Nights:</strong> ${nights}</div>
      <div><strong>Room:</strong> ${booking.room_id.number} (${booking.room_id.type})</div>
      <div><strong>Adults:</strong> ${booking.adults ?? 0}</div>
      <div><strong>Children:</strong> ${booking.children ?? 0}</div>
    </div>
  </div>
  `;

  const companySection =
    booking.companyName || booking.companyGSTIN || booking.companyAddress
      ? `
  <div class="section">
    <div class="section-title">Company / Billing Details</div>
    <div class="company-box">
      ${
        booking.companyName
          ? `<div class="info-item"><strong>Company Name:</strong> ${booking.companyName}</div>`
          : ""
      }
      ${
        booking.companyGSTIN
          ? `<div class="info-item"><strong>GSTIN:</strong> ${booking.companyGSTIN}</div>`
          : ""
      }
      ${
        booking.companyAddress
          ? `<div class="info-item"><strong>Company Address:</strong> ${booking.companyAddress}</div>`
          : ""
      }
    </div>
  </div>
`
      : "";

  return `
  <div class="section">
    <div class="section-title">Guest Information</div>
    <div class="info-grid">
      <div><strong>Name:</strong> ${booking.guestName}</div>
      <div><strong>Phone:</strong> ${booking.guestPhone}</div>
      <div><strong>City:</strong> ${booking.guestCity}</div>
      <div><strong>Nationality:</strong> ${booking.guestNationality}</div>
      <div><strong>Plan:</strong> ${readablePlan(booking.planCode)}</div>
      ${
        booking.guestAddress
          ? `<div><strong>Address:</strong> ${booking.guestAddress}</div>`
          : ""
      }
    </div>
  </div>

  ${stayDetailsSection}

  ${companySection}
`;
}

export const calcExtraServiceAmount = (s: any, nights: number) => {
  const days =
    Array.isArray(s.days) && s.days.length > 0
      ? s.days
      : Array.from({ length: nights }, (_, i) => i + 1);

  const qty = days.length;
  const base = (s.price || 0) * qty;

  const gstEnabled =
    s.gstEnabled === undefined ? true : Boolean(s.gstEnabled);

  const gst = gstEnabled ? +(base * 0.05).toFixed(2) : 0;

  return {
    qty,
    base,
    gstEnabled,
    cgst: +(gst / 2).toFixed(2),
    sgst: +(gst / 2).toFixed(2),
    total: base + gst,
    days,
  };
};

export function readablePlan(planCode?: string) {
  if (!planCode) return "N/A";
  const raw = String(planCode).split("_")[0];
  return PLAN_NAMES[raw] || raw;
}


export function calculateHotelNights(checkInISO: string, checkOutISO: string) {
  const checkIn = new Date(checkInISO);
  const checkOut = new Date(checkOutISO);

  const inDate = new Date(
    checkIn.getFullYear(),
    checkIn.getMonth(),
    checkIn.getDate()
  );

  const outDate = new Date(
    checkOut.getFullYear(),
    checkOut.getMonth(),
    checkOut.getDate()
  );

  const diffDays = Math.round(
    (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Hotel rule: inclusive of both dates
  return Math.max(1, diffDays + 1);
}