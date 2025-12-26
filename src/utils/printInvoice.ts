// src/utils/printInvoice.ts
// FIXED: Now uses billingData consistently instead of booking.cgst/sgst

const fmt = (n?: number) =>
  (typeof n === "number" ? n : 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const calcExtraServiceAmount = (s: any, nights: number) => {
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

const PLAN_NAMES: Record<string, string> = {
  EP: "European Plan",
  CP: "Continental Plan",
  AP: "American Plan",
  MAP: "Modified American Plan",
};

function readablePlan(planCode?: string) {
  if (!planCode) return "N/A";
  const raw = String(planCode).split("_")[0];
  return PLAN_NAMES[raw] || raw;
}

const invoiceStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; padding: 20px; background: #fff; }
    .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { font-size: 28px; margin-bottom: 5px; }
    .header p { font-size: 14px; color: #555; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item { padding: 5px 0; }
    .info-item strong { display: inline-block; min-width: 140px; }
    .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .table th, .table td { border: 1px solid #333; padding: 8px; text-align: left; }
    .table th { background-color: #f0f0f0; font-weight: bold; }
    .table td.text-right, .table th.text-right { text-align: right; }
    .table td.text-center { text-align: center; }
    .total-section { margin-top: 20px; border-top: 2px solid #333; padding-top: 15px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
    .total-row.grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #333; text-align: center; font-size: 12px; color: #666; }
    .company-box { background-color: #f9f9f9; padding: 12px; border: 1px solid #ddd; margin-bottom: 15px; border-radius: 4px; }
    .gst-badge { display: inline-block; padding: 2px 8px; background-color: #4CAF50; color: white; border-radius: 3px; font-size: 11px; margin-left: 8px; }
    .no-gst-badge { display: inline-block; padding: 2px 8px; background-color: #999; color: white; border-radius: 3px; font-size: 11px; margin-left: 8px; }
    @media print {
      body { padding: 0; }
      .invoice-container { border: none; }
    }
  </style>
`;

export function buildRoomInvoice(
  booking: any,
  hotel: any,
  billingData: any,
  finalPaymentReceived: boolean,
  finalPaymentMode: string
) {
  const nights = billingData.nights;
  const roomStayTotal = billingData.roomStayTotal;

  // Calculate extras with GST details
  let extrasRows = "";
  (booking.addedServices || []).forEach((s: any) => {
    const calc = calcExtraServiceAmount(s, nights);
    const gstBadge = calc.gstEnabled
      ? '<span class="gst-badge">GST 5%</span>'
      : '<span class="no-gst-badge">No GST</span>';

    extrasRows += `
      <tr>
        <td>${s.name} ${gstBadge}</td>
        <td class="text-center">${calc.qty} day${calc.qty > 1 ? "s" : ""}</td>
        <td class="text-right">₹${fmt(s.price)}</td>
        <td class="text-right">₹${fmt(calc.base)}</td>
      </tr>
    `;

    if (calc.gstEnabled) {
      extrasRows += `
        <tr>
          <td colspan="3" style="padding-left: 30px; font-size: 12px; color: #666;">CGST (2.5%)</td>
          <td class="text-right" style="font-size: 12px;">₹${fmt(calc.cgst)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding-left: 30px; font-size: 12px; color: #666;">SGST (2.5%)</td>
          <td class="text-right" style="font-size: 12px;">₹${fmt(calc.sgst)}</td>
        </tr>
      `;
    }
  });

  const companySection =
    booking.companyName || booking.companyGSTIN
      ? `
    <div class="section">
      <div class="section-title">Company / Billing Details</div>
      <div class="company-box">
        ${booking.companyName ? `<div class="info-item"><strong>Company Name:</strong> ${booking.companyName}</div>` : ""}
        ${booking.companyGSTIN ? `<div class="info-item"><strong>GSTIN:</strong> ${booking.companyGSTIN}</div>` : ""}
        ${booking.companyAddress ? `<div class="info-item"><strong>Company Address:</strong> ${booking.companyAddress}</div>` : ""}
      </div>
    </div>
  `
      : "";

  const balance = finalPaymentReceived ? 0 : billingData.balance;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Room Invoice</title>
      ${invoiceStyles}
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <h1>${hotel?.name || "Hotel"}</h1>
          <p>${hotel?.address || ""}</p>
          <p>Phone: ${hotel?.phone || ""} | Email: ${hotel?.email || ""}</p>
          ${hotel?.gstNumber ? `<p><strong>GSTIN:</strong> ${hotel.gstNumber}</p>` : ""}
          <p style="margin-top: 10px; font-size: 18px; font-weight: bold;">ROOM INVOICE</p>
        </div>

        <div class="section">
          <div class="section-title">Guest Information</div>
          <div class="info-grid">
            <div class="info-item"><strong>Name:</strong> ${booking.guestName}</div>
            <div class="info-item"><strong>Phone:</strong> ${booking.guestPhone}</div>
            <div class="info-item"><strong>City:</strong> ${booking.guestCity || "—"}</div>
            <div class="info-item"><strong>Nationality:</strong> ${booking.guestNationality || "—"}</div>
            <div class="info-item"><strong>Room:</strong> ${booking.room_id?.number || ""} (${booking.room_id?.type || ""})</div>
            <div class="info-item"><strong>Plan:</strong> ${readablePlan(booking.planCode)}</div>
          </div>
          ${booking.guestAddress ? `<div class="info-item" style="margin-top: 10px;"><strong>Address:</strong> ${booking.guestAddress}</div>` : ""}
        </div>

        ${companySection}

        <div class="section">
          <div class="section-title">Stay Details</div>
          <div class="info-grid">
            <div class="info-item"><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleString()}</div>
            <div class="info-item"><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleString()}</div>
            <div class="info-item"><strong>Number of Nights:</strong> ${nights}</div>
            <div class="info-item"><strong>Adults:</strong> ${booking.adults} | <strong>Children:</strong> ${booking.children}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Billing Details</div>
          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-center">Quantity</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Room Charges ${booking.gstEnabled ? '<span class="gst-badge">GST 5%</span>' : '<span class="no-gst-badge">No GST</span>'}</td>
                <td class="text-center">${nights} night${nights > 1 ? "s" : ""}</td>
                <td class="text-right">₹${fmt(billingData.roomPrice)}</td>
                <td class="text-right">₹${fmt(roomStayTotal)}</td>
              </tr>
              ${extrasRows}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${fmt(billingData.roomBase)}</span>
            </div>
            ${
              booking.gstEnabled
                ? `
            <div class="total-row">
              <span>CGST (2.5%):</span>
              <span>₹${fmt(billingData.roomCGST)}</span>
            </div>
            <div class="total-row">
              <span>SGST (2.5%):</span>
              <span>₹${fmt(billingData.roomSGST)}</span>
            </div>
            `
                : ""
            }
            <div class="total-row">
              <span>Gross Total:</span>
              <span>₹${fmt(billingData.roomGross)}</span>
            </div>
            ${
              billingData.roomDiscountAmount > 0
                ? `
            <div class="total-row" style="color: #d32f2f;">
              <span>Discount (${booking.discount}%):</span>
              <span>- ₹${fmt(billingData.roomDiscountAmount)}</span>
            </div>
            `
                : ""
            }
            <div class="total-row grand-total">
              <span>Room Total:</span>
              <span>₹${fmt(billingData.roomNet)}</span>
            </div>
            <div class="total-row" style="color: #4CAF50;">
              <span>Advance Paid (${booking.advancePaymentMode}):</span>
              <span>₹${fmt(booking.advancePaid)}</span>
            </div>
            ${
              finalPaymentReceived
                ? `
            <div class="total-row" style="color: #4CAF50;">
              <span>Final Payment Received (${finalPaymentMode}):</span>
              <span>₹${fmt(billingData.balance)}</span>
            </div>
            `
                : ""
            }
            <div class="total-row grand-total" style="color: ${balance > 0 ? "#d32f2f" : "#4CAF50"};">
              <span>Balance Due:</span>
              <span>₹${fmt(balance)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing ${hotel?.name || "our hotel"}!</p>
          <p style="margin-top: 5px;">This is a computer-generated invoice.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function buildFoodInvoice(
  booking: any,
  hotel: any,
  billingData: any,
  roomOrders: any[],
  finalPaymentReceived: boolean,
  finalPaymentMode: string
) {
  const orderRows = roomOrders
    .map((order) => {
      const itemRows = order.items
        .map(
          (item: any) => `
        <tr>
          <td>${item.name}</td>
          <td class="text-center">${item.qty}</td>
          <td class="text-right">₹${fmt(item.unitPrice || (item.totalPrice / item.qty))}</td>
          <td class="text-right">₹${fmt(item.totalPrice)}</td>
        </tr>
      `
        )
        .join("");

      return itemRows;
    })
    .join("");

  const companySection =
    booking.companyName || booking.companyGSTIN
      ? `
    <div class="section">
      <div class="section-title">Company / Billing Details</div>
      <div class="company-box">
        ${booking.companyName ? `<div class="info-item"><strong>Company Name:</strong> ${booking.companyName}</div>` : ""}
        ${booking.companyGSTIN ? `<div class="info-item"><strong>GSTIN:</strong> ${booking.companyGSTIN}</div>` : ""}
        ${booking.companyAddress ? `<div class="info-item"><strong>Company Address:</strong> ${booking.companyAddress}</div>` : ""}
      </div>
    </div>
  `
      : "";

  const balance = finalPaymentReceived ? 0 : billingData.balance;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Food Invoice</title>
      ${invoiceStyles}
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <h1>${hotel?.name || "Hotel"}</h1>
          <p>${hotel?.address || ""}</p>
          <p>Phone: ${hotel?.phone || ""} | Email: ${hotel?.email || ""}</p>
          ${hotel?.gstNumber ? `<p><strong>GSTIN:</strong> ${hotel.gstNumber}</p>` : ""}
          <p style="margin-top: 10px; font-size: 18px; font-weight: bold;">FOOD / ROOM SERVICE INVOICE</p>
        </div>

        <div class="section">
          <div class="section-title">Guest Information</div>
          <div class="info-grid">
            <div class="info-item"><strong>Name:</strong> ${booking.guestName}</div>
            <div class="info-item"><strong>Phone:</strong> ${booking.guestPhone}</div>
            <div class="info-item"><strong>Room:</strong> ${booking.room_id?.number || ""} (${booking.room_id?.type || ""})</div>
          </div>
        </div>

        ${companySection}

        <div class="section">
          <div class="section-title">Food Orders</div>
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${orderRows}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>Food Subtotal:</span>
              <span>₹${fmt(billingData.foodSubtotalRaw)}</span>
            </div>
            ${
              billingData.foodDiscountAmount > 0
                ? `
            <div class="total-row" style="color: #d32f2f;">
              <span>Discount (${booking.foodDiscount}%):</span>
              <span>- ₹${fmt(billingData.foodDiscountAmount)}</span>
            </div>
            <div class="total-row">
              <span>Discounted Subtotal:</span>
              <span>₹${fmt(billingData.foodSubtotalAfterDiscount)}</span>
            </div>
            `
                : ""
            }
            ${
              booking.foodGSTEnabled
                ? `
            <div class="total-row">
              <span>CGST (2.5%):</span>
              <span>₹${fmt(billingData.foodCGST)}</span>
            </div>
            <div class="total-row">
              <span>SGST (2.5%):</span>
              <span>₹${fmt(billingData.foodSGST)}</span>
            </div>
            `
                : ""
            }
            <div class="total-row grand-total">
              <span>Food Total:</span>
              <span>₹${fmt(billingData.foodTotal)}</span>
            </div>
            ${
              finalPaymentReceived
                ? `
            <div class="total-row" style="color: #4CAF50;">
              <span>Payment Received (${finalPaymentMode}):</span>
              <span>₹${fmt(billingData.foodTotal)}</span>
            </div>
            `
                : ""
            }
            <div class="total-row grand-total" style="color: ${balance > 0 ? "#d32f2f" : "#4CAF50"};">
              <span>Balance Due:</span>
              <span>₹${fmt(finalPaymentReceived ? 0 : billingData.foodTotal)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your order!</p>
          <p style="margin-top: 5px;">This is a computer-generated invoice.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function buildCombinedInvoice(
  booking: any,
  hotel: any,
  billingData: any,
  roomOrders: any[],
  finalPaymentReceived: boolean,
  finalPaymentMode: string
) {
  const nights = billingData.nights;

  // Room details with extras
  let extrasRows = "";
  (booking.addedServices || []).forEach((s: any) => {
    const calc = calcExtraServiceAmount(s, nights);
    const gstBadge = calc.gstEnabled
      ? '<span class="gst-badge">GST 5%</span>'
      : '<span class="no-gst-badge">No GST</span>';

    extrasRows += `
      <tr>
        <td>${s.name} ${gstBadge}</td>
        <td class="text-center">${calc.qty} day${calc.qty > 1 ? "s" : ""}</td>
        <td class="text-right">₹${fmt(s.price)}</td>
        <td class="text-right">₹${fmt(calc.base)}</td>
      </tr>
    `;

    if (calc.gstEnabled) {
      extrasRows += `
        <tr>
          <td colspan="3" style="padding-left: 30px; font-size: 12px; color: #666;">CGST (2.5%)</td>
          <td class="text-right" style="font-size: 12px;">₹${fmt(calc.cgst)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding-left: 30px; font-size: 12px; color: #666;">SGST (2.5%)</td>
          <td class="text-right" style="font-size: 12px;">₹${fmt(calc.sgst)}</td>
        </tr>
      `;
    }
  });

  // Food orders
  const orderRows = roomOrders
    .map((order) =>
      order.items
        .map(
          (item: any) => `
        <tr>
          <td>${item.name}</td>
          <td class="text-center">${item.qty}</td>
          <td class="text-right">₹${fmt(item.unitPrice || (item.totalPrice / item.qty))}</td>
          <td class="text-right">₹${fmt(item.totalPrice)}</td>
        </tr>
      `
        )
        .join("")
    )
    .join("");

  const companySection =
    booking.companyName || booking.companyGSTIN
      ? `
    <div class="section">
      <div class="section-title">Company / Billing Details</div>
      <div class="company-box">
        ${booking.companyName ? `<div class="info-item"><strong>Company Name:</strong> ${booking.companyName}</div>` : ""}
        ${booking.companyGSTIN ? `<div class="info-item"><strong>GSTIN:</strong> ${booking.companyGSTIN}</div>` : ""}
        ${booking.companyAddress ? `<div class="info-item"><strong>Company Address:</strong> ${booking.companyAddress}</div>` : ""}
      </div>
    </div>
  `
      : "";

  const balance = finalPaymentReceived ? 0 : billingData.balance;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Combined Invoice</title>
      ${invoiceStyles}
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <h1>${hotel?.name || "Hotel"}</h1>
          <p>${hotel?.address || ""}</p>
          <p>Phone: ${hotel?.phone || ""} | Email: ${hotel?.email || ""}</p>
          ${hotel?.gstNumber ? `<p><strong>GSTIN:</strong> ${hotel.gstNumber}</p>` : ""}
          <p style="margin-top: 10px; font-size: 18px; font-weight: bold;">COMPLETE INVOICE</p>
        </div>

        <div class="section">
          <div class="section-title">Guest Information</div>
          <div class="info-grid">
            <div class="info-item"><strong>Name:</strong> ${booking.guestName}</div>
            <div class="info-item"><strong>Phone:</strong> ${booking.guestPhone}</div>
            <div class="info-item"><strong>City:</strong> ${booking.guestCity || "—"}</div>
            <div class="info-item"><strong>Nationality:</strong> ${booking.guestNationality || "—"}</div>
            <div class="info-item"><strong>Room:</strong> ${booking.room_id?.number || ""} (${booking.room_id?.type || ""})</div>
            <div class="info-item"><strong>Plan:</strong> ${readablePlan(booking.planCode)}</div>
          </div>
          ${booking.guestAddress ? `<div class="info-item" style="margin-top: 10px;"><strong>Address:</strong> ${booking.guestAddress}</div>` : ""}
        </div>

        ${companySection}

        <div class="section">
          <div class="section-title">Stay Details</div>
          <div class="info-grid">
            <div class="info-item"><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleString()}</div>
            <div class="info-item"><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleString()}</div>
            <div class="info-item"><strong>Number of Nights:</strong> ${nights}</div>
            <div class="info-item"><strong>Adults:</strong> ${booking.adults} | <strong>Children:</strong> ${booking.children}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Room Charges</div>
          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-center">Quantity</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Room Charges ${booking.gstEnabled ? '<span class="gst-badge">GST 5%</span>' : '<span class="no-gst-badge">No GST</span>'}</td>
                <td class="text-center">${nights} night${nights > 1 ? "s" : ""}</td>
                <td class="text-right">₹${fmt(billingData.roomPrice)}</td>
                <td class="text-right">₹${fmt(billingData.roomStayTotal)}</td>
              </tr>
              ${extrasRows}
            </tbody>
          </table>
        </div>

        ${
          roomOrders.length > 0
            ? `
        <div class="section">
          <div class="section-title">Food / Room Service</div>
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${orderRows}
            </tbody>
          </table>
        </div>
        `
            : ""
        }

        <div class="section">
          <div class="section-title">Final Summary</div>
          <div class="total-section">
            <div class="total-row">
              <span>Room Charges:</span>
              <span>₹${fmt(billingData.roomBase)}</span>
            </div>
            ${
              booking.gstEnabled
                ? `
            <div class="total-row">
              <span>Room CGST (2.5%):</span>
              <span>₹${fmt(billingData.roomCGST)}</span>
            </div>
            <div class="total-row">
              <span>Room SGST (2.5%):</span>
              <span>₹${fmt(billingData.roomSGST)}</span>
            </div>
            `
                : ""
            }
            ${
              billingData.roomDiscountAmount > 0
                ? `
            <div class="total-row" style="color: #d32f2f;">
              <span>Room Discount (${booking.discount}%):</span>
              <span>- ₹${fmt(billingData.roomDiscountAmount)}</span>
            </div>
            `
                : ""
            }
            <div class="total-row" style="font-weight: bold;">
              <span>Room Net Total:</span>
              <span>₹${fmt(billingData.roomNet)}</span>
            </div>

            ${
              roomOrders.length > 0
                ? `
            <div class="total-row" style="margin-top: 15px;">
              <span>Food Subtotal:</span>
              <span>₹${fmt(billingData.foodSubtotalRaw)}</span>
            </div>
            ${
              billingData.foodDiscountAmount > 0
                ? `
            <div class="total-row" style="color: #d32f2f;">
              <span>Food Discount (${booking.foodDiscount}%):</span>
              <span>- ₹${fmt(billingData.foodDiscountAmount)}</span>
            </div>
            `
                : ""
            }
            ${
              booking.foodGSTEnabled
                ? `
            <div class="total-row">
              <span>Food CGST (2.5%):</span>
              <span>₹${fmt(billingData.foodCGST)}</span>
            </div>
            <div class="total-row">
              <span>Food SGST (2.5%):</span>
              <span>₹${fmt(billingData.foodSGST)}</span>
            </div>
            `
                : ""
            }
            <div class="total-row" style="font-weight: bold;">
              <span>Food Net Total:</span>
              <span>₹${fmt(billingData.foodTotal)}</span>
            </div>
            `
                : ""
            }

            <div class="total-row grand-total" style="margin-top: 15px;">
              <span>Grand Total:</span>
              <span>₹${fmt(billingData.grandTotal)}</span>
            </div>
            <div class="total-row" style="color: #4CAF50;">
              <span>Advance Paid (${booking.advancePaymentMode}):</span>
              <span>₹${fmt(booking.advancePaid)}</span>
            </div>
            ${
              finalPaymentReceived
                ? `
            <div class="total-row" style="color: #4CAF50;">
              <span>Final Payment Received (${finalPaymentMode}):</span>
              <span>₹${fmt(billingData.balance)}</span>
            </div>
            `
                : ""
            }
            <div class="total-row grand-total" style="color: ${balance > 0 ? "#d32f2f" : "#4CAF50"};">
              <span>Balance Due:</span>
              <span>₹${fmt(balance)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing ${hotel?.name || "our hotel"}!</p>
          <div class="signature-box">
            <div class="signature-line">FRONT OFFICE MANAGER</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">CASHIER</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Guest Sign.</div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 9px;">
          E. & O.E. | Prepared By: ${hotel?.name || "System"} on ${new Date().toLocaleString("en-IN")}
        </div>
      </div>
      
      <div class="no-print" style="text-align: center; margin: 20px;">
        <button onclick="window.print()" style="padding: 10px 30px; font-size: 14px; cursor: pointer;">
          Print Invoice
        </button>
      </div>
    </body>
    </html>
  `;
}