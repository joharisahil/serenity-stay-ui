export const openPrintWindow = (bill: any) => {
  const w = window.open("", "_blank", "width=900,height=1000,scrollbars=yes");
  if (!w) return alert("Enable popups for printing.");

  const escapeHtml = (s: any) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const styles = `/* your existing invoice CSS */`;

  const invoiceHtml = (copyLabel: string) => `
    /* same invoice template you wrote earlier */
  `;

  w.document.open();
  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head><title>Invoice</title>${styles}</head>
    <body>
      ${invoiceHtml("Restaurant Copy")}
      ${invoiceHtml("Customer Copy")}
      <button onclick="window.print()">Print</button>
    </body>
    </html>
  `);
  w.document.close();

  setTimeout(() => w.print(), 400);
};

// ----------------------------------------------
// utils/invoiceBuilder.ts
// Centralized invoice HTML generator
// ----------------------------------------------

export function buildHeaderHtml(hotel: any, data: any) {
  return `
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div style="width:50%; text-align:left;">
        <div style="font-weight:700; font-size:18px;">${hotel?.name || ""}</div>
        <div style="font-size:12px; margin-top:6px;">${hotel?.address || ""}</div>
        <div style="font-size:12px; margin-top:4px;">Phone: ${hotel?.phone || ""}</div>
        ${hotel?.email ? `<div style="font-size:12px;">Email: ${hotel.email}</div>` : ""}
        ${hotel?.gstNumber ? `<div style="font-size:12px;">GSTIN: ${hotel.gstNumber}</div>` : ""}
      </div>

      <div style="width:45%; text-align:right;">
        <div style="font-weight:700; font-size:16px;">${data.invoiceTitle}</div>
        <div style="font-size:13px; margin-top:6px;">Invoice: <strong>${data.invoiceNumber}</strong></div>
        <div style="font-size:12px; margin-top:4px;">Date: ${data.createdAt}</div>
        <div style="font-size:12px; margin-top:8px;">Guest: ${data.guestName}</div>
        <div style="font-size:12px;">Phone: ${data.guestPhone}</div>
        <div style="font-size:12px;">Room: ${data.roomNumber}</div>
      </div>
    </div>

    <hr style="margin:12px 0; border:none; border-top:1px solid #ccc;" />
  `;
}

const fmt = (n?: number) =>
  (typeof n === "number" ? n : 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });


// -----------------------------------------------------
// ROOM INVOICE ONLY
// -----------------------------------------------------
export function buildRoomInvoice(booking: any, hotel: any, bill: any) {
  const invoiceNumber = `ROOM-${booking._id?.toString().slice(-6)}`;
  const createdAt = new Date().toLocaleString();

  return `
  <html>
    <head>
      <title>Room Invoice</title>
      <style>
        body { font-family: Arial; padding:20px; }
        .row { display:flex; justify-content:space-between; margin:6px 0; }
      </style>
    </head>

    <body>
      ${buildHeaderHtml(hotel, {
        invoiceTitle: "Room Invoice",
        invoiceNumber,
        createdAt,
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        roomNumber: booking.room_id.number,
      })}

      <div class="row">
        <div>Room Rate × Nights</div>
        <div>₹${fmt(bill.roomPrice)} × ${bill.nights} = ₹${fmt(bill.roomStayTotal)}</div>
      </div>

      ${(booking.addedServices || [])
        .map(
          (s: any) =>
            `<div class="row"><div>${s.name}</div><div>₹${fmt(s.price)}</div></div>`
        )
        .join("")}

      <hr/>

      <div class="row"><strong>Room Subtotal</strong><strong>₹${fmt(bill.roomBase)}</strong></div>
      <div class="row"><div>CGST (2.5%)</div><div>₹${fmt(bill.roomCGST)}</div></div>
      <div class="row"><div>SGST (2.5%)</div><div>₹${fmt(bill.roomSGST)}</div></div>

      <div class="row"><strong>Discount (${booking.discount}%)</strong><strong>₹${fmt(bill.roomDiscountAmount)}</strong></div>

      <div class="row"><strong>Room Total</strong><strong>₹${fmt(bill.roomNet)}</strong></div>

      <div style="margin-top:40px;">
        <div>Advance Paid: ₹${fmt(booking.advancePaid)}</div>
        <div style="margin-top:8px; font-weight:700;">Balance: ₹${fmt(bill.balance)}</div>
      </div>

      <div style="margin-top:60px;">
        <div>Authorised Signature</div>
        <div style="margin-top:40px; border-top:1px solid #000; width:160px;"></div>
      </div>
    </body>
  </html>
  `;
}


// -----------------------------------------------------
// FOOD INVOICE
// -----------------------------------------------------
export function buildFoodInvoice(
  booking: any,
  hotel: any,
  bill: any,
  roomOrders: any[]
) {
  const invoiceNumber = `FOOD-${booking._id?.toString().slice(-6)}`;
  const createdAt = new Date().toLocaleString();

  return `
  <html>
    <head>
      <title>Food Invoice</title>
      <style>
        body { font-family: Arial; padding:20px; }
        .table { width:100%; border-collapse:collapse; margin-top:8px; }
        .table th, .table td { border:1px solid #ddd; padding:8px; font-size:13px; }
        .right { text-align:right; }
      </style>
    </head>

    <body>
      ${buildHeaderHtml(hotel, {
        invoiceTitle: "Food Invoice",
        invoiceNumber,
        createdAt,
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        roomNumber: booking.room_id.number,
      })}

      <table class="table">
        <thead>
          <tr><th>Order</th><th>Items</th><th class="right">Amount</th></tr>
        </thead>
        <tbody>
          ${roomOrders
            .map(
              (o: any) => `
              <tr>
                <td>
                  Order #${String(o._id).slice(-6)}
                  <br/><small>${new Date(o.createdAt).toLocaleString()}</small>
                </td>

                <td>
                  ${o.items.map((i: any) => `${i.name} × ${i.qty}`).join("<br/>")}
                </td>

                <td class="right">₹${fmt(o.total)}</td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>

      <div style="margin-top:12px; text-align:right;">
        <div>Food Subtotal: ₹${fmt(bill.foodSubtotalRaw)}</div>
        <div>Food Discount: ₹${fmt(bill.foodDiscountAmount)}</div>
        <div>CGST: ₹${fmt(bill.foodCGST)}</div>
        <div>SGST: ₹${fmt(bill.foodSGST)}</div>
        <div style="font-weight:700; margin-top:8px;">Total: ₹${fmt(bill.foodTotal)}</div>
      </div>

      <div style="margin-top:60px;">
        <div>Authorised Signature</div>
        <div style="margin-top:40px; border-top:1px solid #000; width:160px;"></div>
      </div>
    </body>
  </html>
  `;
}


// -----------------------------------------------------
// FINAL COMBINED INVOICE
// -----------------------------------------------------
export function buildCombinedInvoice(
  booking: any,
  hotel: any,
  bill: any,
  roomOrders: any[]
) {
  const invoiceNumber = `FINAL-${booking._id?.toString().slice(-6)}`;
  const createdAt = new Date().toLocaleString();

  return `
  <html>
    <head>
      <title>Combined Invoice</title>
      <style>
        body { font-family: Arial; padding:20px; }
        .row { display:flex; justify-content:space-between; margin:6px 0; }
        .items { font-size:12px; margin-left:12px; color:#444; }
      </style>
    </head>

    <body>
      ${buildHeaderHtml(hotel, {
        invoiceTitle: "Final Invoice",
        invoiceNumber,
        createdAt,
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        roomNumber: booking.room_id.number,
      })}

      <h3>Stay Charges</h3>

      <div class="row">
        <div>Room (${bill.nights} nights × ₹${fmt(bill.roomPrice)})</div>
        <div>₹${fmt(bill.roomStayTotal)}</div>
      </div>

      ${(booking.addedServices || [])
        .map(
          (s: any) =>
            `<div class="row"><div>${s.name}</div><div>₹${fmt(s.price)}</div></div>`
        )
        .join("")}

      <div class="row"><div>Room Subtotal</div><div>₹${fmt(bill.roomBase)}</div></div>
      <div class="row"><div>CGST (2.5%)</div><div>₹${fmt(bill.roomCGST)}</div></div>
      <div class="row"><div>SGST (2.5%)</div><div>₹${fmt(bill.roomSGST)}</div></div>

      <div class="row"><div>Room Discount</div><div>₹${fmt(bill.roomDiscountAmount)}</div></div>

      <h3>Food</h3>

      ${roomOrders
        .map(
          (o: any) => `
        <div class="row">
          <div>
            Order #${String(o._id).slice(-6)}
            <br/>
            <small>${new Date(o.createdAt).toLocaleString()}</small>
          </div>
          <div>₹${fmt(o.total)}</div>
        </div>
      `
        )
        .join("")}

      <div class="row"><div>Food Subtotal</div><div>₹${fmt(bill.foodSubtotalRaw)}</div></div>
      <div class="row"><div>Food Discount</div><div>₹${fmt(bill.foodDiscountAmount)}</div></div>
      <div class="row"><div>CGST</div><div>₹${fmt(bill.foodCGST)}</div></div>
      <div class="row"><div>SGST</div><div>₹${fmt(bill.foodSGST)}</div></div>

      <hr/>

      <div class="row"><strong>Grand Total</strong><strong>₹${fmt(bill.grandTotal)}</strong></div>
      <div class="row"><div>Advance Paid</div><div>₹${fmt(booking.advancePaid)}</div></div>

      <div class="row" style="font-weight:700;">
        <div>Balance Due</div>
        <div>₹${fmt(bill.balance)}</div>
      </div>

      <div style="margin-top:60px;">
        <div>Authorised Signature</div>
        <div style="margin-top:40px; border-top:1px solid #000; width:160px;"></div>
      </div>
    </body>
  </html>
  `;
}
