import { invoiceStyles } from "./invoiceConstants";
import { fmt, calcExtraServiceAmount,buildGuestAndCompanySection, readablePlan } from "./invoiceHelpers";

export function buildRoomInvoice(
  booking: any,
  hotel: any,
  billingData: any,
  finalPaymentReceived: boolean,
  finalPaymentMode: string
) {
  const nights = billingData.nights;

  /* ===============================
     ROOM RATE (FROM PLAN)
  =============================== */
  const [planCode, occupancy] = booking.planCode.split("_");
  const plan = booking.room_id?.plans?.find((p: any) => p.code === planCode);
  const roomRate =
    occupancy === "SINGLE" ? plan?.singlePrice : plan?.doublePrice;

  /* ===============================
     ROOM BASE (STAY ONLY)
  =============================== */
  const roomBase = roomRate * nights;

  /* ===============================
     EXTRA SERVICES (ROOM ONLY)
  =============================== */
  let extrasBase = 0;
  let extrasRows = "";

  (booking.addedServices || []).forEach((s: any) => {
    const qty = Array.isArray(s.days) ? s.days.length : 0;
    const base = Number(s.price || 0) * qty;

    extrasBase += base;

    const cgst = s.gstEnabled ? +(base * 0.025).toFixed(2) : 0;
    const sgst = s.gstEnabled ? +(base * 0.025).toFixed(2) : 0;

    extrasRows += `
      <tr>
        <td>${s.name} <span class="gst-badge">GST 5%</span></td>
        <td class="text-center">${qty} day${qty > 1 ? "s" : ""}</td>
        <td class="text-right">₹${fmt(s.price)}</td>
        <td class="text-right">₹${fmt(base)}</td>
      </tr>
      ${
        s.gstEnabled
          ? `
      <tr>
        <td colspan="3" style="padding-left:30px;font-size:12px;color:#666;">CGST (2.5%)</td>
        <td class="text-right" style="font-size:12px;">₹${fmt(cgst)}</td>
      </tr>
      <tr>
        <td colspan="3" style="padding-left:30px;font-size:12px;color:#666;">SGST (2.5%)</td>
        <td class="text-right" style="font-size:12px;">₹${fmt(sgst)}</td>
      </tr>
      `
          : ""
      }
    `;
  });

  /* ===============================
     ROOM TAXABLE & GST (ROOM ONLY)
  =============================== */
  const roomTaxable = roomBase + extrasBase;
  const roomCGST = booking.gstEnabled ? +(roomTaxable * 0.025).toFixed(2) : 0;
  const roomSGST = booking.gstEnabled ? +(roomTaxable * 0.025).toFixed(2) : 0;

  const roomTotal = roomTaxable + roomCGST + roomSGST;

  /* ===============================
     BALANCE (ROOM ONLY)
  =============================== */
  const balanceDue = Math.max(0, roomTotal - booking.advancePaid);

  /* ===============================
     COMPANY SECTION
  =============================== */
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
    <h1>${hotel.name}</h1>
    <p>${hotel.address}</p>
    <p>Phone: ${hotel.phone} | Email: ${hotel.email}</p>
    <p><strong>GSTIN:</strong> ${hotel.gstNumber}</p>
    <p style="font-size:18px;font-weight:bold;">ROOM INVOICE</p>
  </div>

 ${buildGuestAndCompanySection(booking)}

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
          <td>Room Charges <span class="gst-badge">GST 5%</span></td>
          <td class="text-center">${nights} nights</td>
          <td class="text-right">₹${fmt(roomRate)}</td>
          <td class="text-right">₹${fmt(roomBase)}</td>
        </tr>
        ${extrasRows}
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-row"><span>Subtotal:</span><span>₹${fmt(
        roomTaxable
      )}</span></div>
      <div class="total-row"><span>CGST (2.5%):</span><span>₹${fmt(
        roomCGST
      )}</span></div>
      <div class="total-row"><span>SGST (2.5%):</span><span>₹${fmt(
        roomSGST
      )}</span></div>
      <div class="total-row"><span>Gross Total:</span><span>₹0</span></div>
      <div class="total-row grand-total"><span>Room Total:</span><span>₹${fmt(
        roomTotal
      )}</span></div>
      <div class="total-row"><span>Advance Paid (${
        booking.advancePaymentMode
      }):</span><span>₹${fmt(booking.advancePaid)}</span></div>
      <div class="total-row grand-total" style="color:#d32f2f;"><span>Balance Due:</span><span>₹${fmt(
        balanceDue
      )}</span></div>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for choosing ${hotel.name}!</p>
  </div>

</div>
</body>
</html>
`;
}

export function buildFoodInvoice(
  booking: any,
  hotel: any,
  billingData: any, // kept for compatibility (not used for totals)
  roomOrders: any[],
  finalPaymentReceived: boolean,
  finalPaymentMode: string
) {
  /* ===============================
     FOOD ITEMS + SUBTOTAL
  =============================== */
  let foodSubtotal = 0;

  const orderRows = roomOrders
    .map((order) =>
      order.items
        .map((item: any) => {
          const rate = item.unitPrice || item.totalPrice / item.qty;
          const amount = item.totalPrice;

          foodSubtotal += amount;

          return `
            <tr>
              <td>${item.name}</td>
              <td class="text-center">${item.qty}</td>
              <td class="text-right">₹${fmt(rate)}</td>
              <td class="text-right">₹${fmt(amount)}</td>
            </tr>
          `;
        })
        .join("")
    )
    .join("");

  foodSubtotal = +foodSubtotal.toFixed(2);

  /* ===============================
     DISCOUNT
  =============================== */
  const foodDiscountPercent = Number(booking.foodDiscount || 0);
  const foodDiscountAmount = +(
    (foodSubtotal * foodDiscountPercent) /
    100
  ).toFixed(2);

  const discountedSubtotal = +(foodSubtotal - foodDiscountAmount).toFixed(2);

  /* ===============================
     GST
  =============================== */
  const foodCGST = booking.foodGSTEnabled
    ? +(discountedSubtotal * 0.025).toFixed(2)
    : 0;

  const foodSGST = booking.foodGSTEnabled
    ? +(discountedSubtotal * 0.025).toFixed(2)
    : 0;

  const foodTotal = +(discountedSubtotal + foodCGST + foodSGST).toFixed(2);

  /* ===============================
     BALANCE
  =============================== */
  const balanceDue = finalPaymentReceived ? 0 : foodTotal;

  /* ===============================
     COMPANY SECTION
  =============================== */
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

  /* ===============================
     HTML
  =============================== */
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
    <h1>${hotel.name}</h1>
    <p>${hotel.address}</p>
    <p>Phone: ${hotel.phone} | Email: ${hotel.email}</p>
    ${
      hotel.gstNumber ? `<p><strong>GSTIN:</strong> ${hotel.gstNumber}</p>` : ""
    }
    <p style="font-size:18px;font-weight:bold;">FOOD / ROOM SERVICE INVOICE</p>
  </div>

  <div class="section">
    <div class="section-title">Guest Information</div>
    <div class="info-grid">
      <div><strong>Name:</strong> ${booking.guestName}</div>
      <div><strong>Phone:</strong> ${booking.guestPhone}</div>
      <div><strong>Room:</strong> ${booking.room_id.number} (${
    booking.room_id.type
  })</div>
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
        <span>₹${fmt(foodSubtotal)}</span>
      </div>

      ${
        foodDiscountAmount > 0
          ? `
      <div class="total-row" style="color:#d32f2f;">
        <span>Discount (${foodDiscountPercent}%):</span>
        <span>- ₹${fmt(foodDiscountAmount)}</span>
      </div>
      <div class="total-row">
        <span>Discounted Subtotal:</span>
        <span>₹${fmt(discountedSubtotal)}</span>
      </div>
      `
          : ""
      }

      ${
        booking.foodGSTEnabled
          ? `
      <div class="total-row">
        <span>CGST (2.5%):</span>
        <span>₹${fmt(foodCGST)}</span>
      </div>
      <div class="total-row">
        <span>SGST (2.5%):</span>
        <span>₹${fmt(foodSGST)}</span>
      </div>
      `
          : ""
      }

      <div class="total-row grand-total">
        <span>Food Total:</span>
        <span>₹${fmt(foodTotal)}</span>
      </div>

      ${
        finalPaymentReceived
          ? `
      <div class="total-row" style="color:#4CAF50;">
        <span>Payment Received (${finalPaymentMode}):</span>
        <span>₹${fmt(foodTotal)}</span>
      </div>
      `
          : ""
      }

      <div class="total-row grand-total" style="color:${
        balanceDue > 0 ? "#d32f2f" : "#4CAF50"
      };">
        <span>Balance Due:</span>
        <span>₹${fmt(balanceDue)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for your order!</p>
    <p>This is a computer-generated invoice.</p>
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

  /* =========================
     ROOM EXTRAS ROWS
  ========================= */
  let extrasRows = "";
  let extrasBase = 0;

  (booking.addedServices || []).forEach((s: any) => {
    const qty = s.days?.length || 0;
    const base = s.price * qty;
    extrasBase += base;

    const cgst = +(base * 0.025).toFixed(2);
    const sgst = +(base * 0.025).toFixed(2);

    extrasRows += `
      <tr>
        <td>${s.name} <span class="gst-badge">GST 5%</span></td>
        <td class="text-center">${qty} day${qty > 1 ? "s" : ""}</td>
        <td class="text-right">₹${fmt(s.price)}</td>
        <td class="text-right">₹${fmt(base)}</td>
      </tr>
      <tr>
        <td colspan="3" style="padding-left:30px;font-size:12px;color:#666;">CGST (2.5%)</td>
        <td class="text-right" style="font-size:12px;">₹${fmt(cgst)}</td>
      </tr>
      <tr>
        <td colspan="3" style="padding-left:30px;font-size:12px;color:#666;">SGST (2.5%)</td>
        <td class="text-right" style="font-size:12px;">₹${fmt(sgst)}</td>
      </tr>
    `;
  });

  /* =========================
     FOOD ROWS + TOTALS
  ========================= */
  let foodSubtotal = 0;

  const orderRows = roomOrders
    .map((order) =>
      order.items
        .map((item: any) => {
          const rate = item.unitPrice || item.totalPrice / item.qty;
          foodSubtotal += item.totalPrice;

          return `
          <tr>
            <td>${item.name}</td>
            <td class="text-center">${item.qty}</td>
            <td class="text-right">₹${fmt(rate)}</td>
            <td class="text-right">₹${fmt(item.totalPrice)}</td>
          </tr>
        `;
        })
        .join("")
    )
    .join("");

  foodSubtotal = +foodSubtotal.toFixed(2);

  const foodDiscountPercent = booking.foodDiscount || 0;
  const foodDiscountAmount = +(
    (foodSubtotal * foodDiscountPercent) /
    100
  ).toFixed(2);
  const foodAfterDiscount = foodSubtotal - foodDiscountAmount;

  const foodCGST = booking.foodGSTEnabled
    ? +(foodAfterDiscount * 0.025).toFixed(2)
    : 0;
  const foodSGST = booking.foodGSTEnabled
    ? +(foodAfterDiscount * 0.025).toFixed(2)
    : 0;
  const foodTotal = +(foodAfterDiscount + foodCGST + foodSGST).toFixed(2);

  /* =========================
     ROOM TOTALS (BACKEND TRUTH)
  ========================= */
  const roomBase = booking.taxable;
  const roomCGST = booking.cgst;
  const roomSGST = booking.sgst;
  const roomNetTotal = roomBase + roomCGST + roomSGST;

  /* =========================
     GRAND TOTAL + BALANCE
  ========================= */
  const grandTotal = +(roomNetTotal + foodTotal).toFixed(2);
  //const balance = finalPaymentReceived ? 0 : +(grandTotal - booking.advancePaid).toFixed(2);
  /* =========================
   ROUND OFF (HOTEL STANDARD)
========================= */
  const roundedGrandTotal = Math.round(grandTotal);
  const roundOffAmount = +(roundedGrandTotal - grandTotal).toFixed(2);

  const finalGrandTotal = roundedGrandTotal;
  const balance = finalPaymentReceived
    ? 0
    : +(finalGrandTotal - booking.advancePaid).toFixed(2);

  
  /* =========================
     HTML
  ========================= */
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
    <h1>${hotel.name}</h1>
    <p>${hotel.address}</p>
    <p>Phone: ${hotel.phone} | Email: ${hotel.email}</p>
    <p><strong>GSTIN:</strong> ${hotel.gstNumber}</p>
    <p style="font-size:18px;font-weight:bold;">COMPLETE INVOICE</p>
  </div>

${buildGuestAndCompanySection(booking)}

  <div class="section">
    <div class="section-title">Room Charges</div>
    <table class="table">
      <tr>
        <td>Room Charges <span class="gst-badge">GST 5%</span></td>
        <td class="text-center">${nights} nights</td>
        <td class="text-right">₹${fmt(billingData.roomPrice)}</td>
        <td class="text-right">₹${fmt(roomBase - extrasBase)}</td>
      </tr>
      ${extrasRows}
    </table>
  </div>

  ${
    roomOrders.length
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
      <tbody>${orderRows}</tbody>
    </table>
  </div>
  `
      : ""
  }

  <div class="section">
    <div class="section-title">Final Summary</div>
    <div class="total-section">

      <div class="total-row"><span>Room Charges:</span><span>₹${fmt(
        roomBase
      )}</span></div>
      <div class="total-row"><span>Room CGST (2.5%):</span><span>₹${fmt(
        roomCGST
      )}</span></div>
      <div class="total-row"><span>Room SGST (2.5%):</span><span>₹${fmt(
        roomSGST
      )}</span></div>
      <div class="total-row" style="font-weight:bold;"><span>Room Net Total:</span><span>₹${fmt(
        roomNetTotal
      )}</span></div>

      ${
        foodSubtotal > 0
          ? `
      <div class="total-row" style="margin-top:10px;"><span>Food Subtotal:</span><span>₹${fmt(
        foodSubtotal
      )}</span></div>
      <div class="total-row" style="color:#d32f2f;"><span>Food Discount (${foodDiscountPercent}%):</span><span>- ₹${fmt(
              foodDiscountAmount
            )}</span></div>
      <div class="total-row"><span>Food CGST (2.5%):</span><span>₹${fmt(
        foodCGST
      )}</span></div>
      <div class="total-row"><span>Food SGST (2.5%):</span><span>₹${fmt(
        foodSGST
      )}</span></div>
      <div class="total-row" style="font-weight:bold;"><span>Food Net Total:</span><span>₹${fmt(
        foodTotal
      )}</span></div>
      `
          : ""
      }

      <div class="total-row">
  <span>Grand Total (Before Round Off):</span>
  <span>₹${fmt(grandTotal)}</span>
</div>

<div class="total-row">
  <span>Round Off:</span>
  <span>${roundOffAmount >= 0 ? "+" : ""}₹${fmt(roundOffAmount)}</span>
</div>

<div class="total-row grand-total">
  <span>Grand Total:</span>
  <span>₹${fmt(finalGrandTotal)}</span>
</div>

      <div class="total-row" style="color:#4CAF50;"><span>Advance Paid (${
        booking.advancePaymentMode
      }):</span><span>₹${fmt(booking.advancePaid)}</span></div>
      <div class="total-row grand-total" style="color:#d32f2f;"><span>Balance Due:</span><span>₹${fmt(
        balance
      )}</span></div>

    </div>
  </div>

  <div class="footer">
    <p>Thank you for choosing ${hotel.name}!</p>
    <div class="signature-box"><div class="signature-line">FRONT OFFICE MANAGER</div></div>
    <div class="signature-box"><div class="signature-line">CASHIER</div></div>
    <div class="signature-box"><div class="signature-line">Guest Sign.</div></div>
  </div>

  <div style="text-align:center;font-size:9px;margin-top:10px;">
    E. & O.E. | Prepared By: ${hotel.name} on ${new Date().toLocaleString(
    "en-IN"
  )}
  </div>

</div>
</body>
</html>
`;
}
