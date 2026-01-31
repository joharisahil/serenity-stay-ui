import { invoiceStyles } from "./invoiceConstants";
import {
  fmt,

  buildGuestAndCompanySection,

} from "./invoiceHelpers";

export function buildRoomInvoice(
  booking: any,
  hotel: any,
  billingData: any,
  finalPaymentReceived: boolean,
  finalPaymentMode: string,
) {
  /* ===============================
     SAFE NIGHT CALCULATION
  =============================== */
  const calculateNights = (checkInISO: string, checkOutISO: string) => {
    const diff =
      (new Date(checkOutISO).getTime() - new Date(checkInISO).getTime()) /
      (1000 * 60 * 60 * 24);

    return Math.max(1, Math.ceil(diff));
  };

  const nights = calculateNights(booking.checkIn, booking.checkOut);

  /* ===============================
     DISPLAY RATE (FOR TABLE ONLY)
  =============================== */
  let displayRoomRate = 0;

  if (booking.pricingType === "FINAL_INCLUSIVE") {
    displayRoomRate = +(booking.finalRoomPrice / 1.05).toFixed(2);
  } else {
    const [planCode, occupancy] = booking.planCode.split("_");
    const plan = booking.room_id?.plans?.find((p: any) => p.code === planCode);

    displayRoomRate =
      occupancy === "SINGLE" ? plan?.singlePrice || 0 : plan?.doublePrice || 0;
  }

  const roomDisplayAmount = +(displayRoomRate * nights).toFixed(2);

  /* ===============================
     EXTRA SERVICES (DISPLAY ONLY)
  =============================== */
  let extrasRows = "";

  (booking.addedServices || []).forEach((s: any) => {
    const qty = Array.isArray(s.days) ? s.days.length : 1;
    const amount = +(Number(s.price || 0) * qty).toFixed(2);

    extrasRows += `
      <tr>
        <td>${s.name} <span class="gst-badge">GST 5%</span></td>
        <td class="text-center">${qty} day${qty > 1 ? "s" : ""}</td>
        <td class="text-right">₹${fmt(s.price)}</td>
        <td class="text-right">₹${fmt(amount)}</td>
      </tr>
    `;
  });

  /* ===============================
     BACKEND TOTALS (SOURCE OF TRUTH)
  =============================== */
  const taxableValue = booking.taxable;
  const cgst = booking.cgst;
  const sgst = booking.sgst;

  const roomGrandTotal = +(taxableValue + cgst + sgst).toFixed(2);

  const rawBalance = +(roomGrandTotal - booking.advancePaid).toFixed(2);
  const balanceDue = finalPaymentReceived ? 0 : Math.max(0, rawBalance);

  /* ===============================
     HTML
  =============================== */
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

  ${finalPaymentReceived ? `<div class="paid-stamp">PAID</div>` : ""}

  <div class="header">
    <h1>${hotel.name}</h1>
    <p>${hotel.address}</p>
    <p>Phone: ${hotel.phone} | Email: ${hotel.email}</p>
    <p><strong>GSTIN:</strong> ${hotel.gstNumber}</p>
    <p style="font-size:18px;font-weight:bold;">ROOM TAX INVOICE</p>
  </div>

  ${buildGuestAndCompanySection(booking)}

  <!-- ================= BILLING DETAILS ================= -->
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
          <td>
            Room Charges <span class="gst-badge">GST 5%</span><br/>
            ${
              booking.pricingType === "FINAL_INCLUSIVE"
                ? "<small>(Offer Price – GST Inclusive)</small>"
                : ""
            }
          </td>
          <td class="text-center">${nights} night${nights > 1 ? "s" : ""}</td>
          <td class="text-right">₹${fmt(displayRoomRate)}</td>
          <td class="text-right">₹${fmt(roomDisplayAmount)}</td>
        </tr>

        ${extrasRows}

        ${
          booking.discountAmount
            ? `
        <tr style="color:#d32f2f;">
          <td colspan="3" style="text-align:right;">
            Room Discount (${booking.discount}%)
          </td>
          <td class="text-right">- ₹${fmt(booking.discountAmount)}</td>
        </tr>`
            : ""
        }

        <tr style="font-weight:bold;">
          <td colspan="3" style="text-align:right;">Taxable Value</td>
          <td class="text-right">₹${fmt(taxableValue)}</td>
        </tr>

        <tr>
          <td colspan="3" style="text-align:right;">CGST (2.5%)</td>
          <td class="text-right">₹${fmt(cgst)}</td>
        </tr>

        <tr>
          <td colspan="3" style="text-align:right;">SGST (2.5%)</td>
          <td class="text-right">₹${fmt(sgst)}</td>
        </tr>

      </tbody>
    </table>
  </div>

  <!-- ================= FINAL SUMMARY ================= -->
  <div class="section">
    <div class="section-title">Final Summary</div>

    <div class="total-row">
      <span>Room + Extras Taxable:</span>
      <span>₹${fmt(taxableValue)}</span>
    </div>

    <div class="total-row">
      <span>CGST (2.5%):</span>
      <span>₹${fmt(cgst)}</span>
    </div>

    <div class="total-row">
      <span>SGST (2.5%):</span>
      <span>₹${fmt(sgst)}</span>
    </div>

    <div class="total-row grand-total">
      <span>Room Grand Total:</span>
      <span>₹${fmt(roomGrandTotal)}</span>
    </div>

    <div class="total-row">
      <span>Advance Paid:</span>
      <span>₹${fmt(booking.advancePaid)}</span>
    </div>

    ${
      finalPaymentReceived
        ? `
    <div class="total-row" style="color:#2e7d32;font-weight:bold;">
      <span>Final Payment Received (${finalPaymentMode || "Cash"}):</span>
      <span>₹${fmt(roomGrandTotal)}</span>
    </div>`
        : `
    <div class="total-row grand-total" style="color:#d32f2f;">
      <span>Balance Due:</span>
      <span>₹${fmt(balanceDue)}</span>
    </div>`
    }
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
  finalPaymentMode: string,
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
        .join(""),
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
  finalPaymentMode: string,
) {
  /* =========================
     NIGHTS (HOTEL CALENDAR RULE)
  ========================= */
  const calculateNights = (checkInISO: string, checkOutISO: string) => {
    const diff =
      (new Date(checkOutISO).getTime() - new Date(checkInISO).getTime()) /
      (1000 * 60 * 60 * 24);

    return Math.max(1, Math.ceil(diff));
  };

  const nights = calculateNights(booking.checkIn, booking.checkOut);

  /* =========================
     ROOM DISPLAY (NOT TOTAL)
  ========================= */
  // const perNightBase =
  //   booking.pricingType === "FINAL_INCLUSIVE"
  //     ? +(booking.finalRoomPrice / 1.05).toFixed(2)
  //     : billingData.roomPrice;

  // const roomDisplayAmount = +(perNightBase * nights).toFixed(2);
  let perNightBase = 0;

  if (booking.pricingType === "FINAL_INCLUSIVE") {
    // Offer price (GST inclusive → extract base)
    perNightBase = +(booking.finalRoomPrice / 1.05).toFixed(2);
  } else {
    // Non-offer pricing → ALWAYS use plan rate
    const [planCode, occupancy] = booking.planCode.split("_");

    const plan = booking.room_id?.plans?.find((p: any) => p.code === planCode);

    perNightBase =
      occupancy === "SINGLE" ? plan?.singlePrice || 0 : plan?.doublePrice || 0;
  }
  const roomDisplayAmount = +(perNightBase * nights).toFixed(2);

  /* =========================
     EXTRA SERVICES (DISPLAY)
  ========================= */
  let extrasRows = "";

  (booking.addedServices || []).forEach((s: any) => {
    const qty = s.days?.length || 1;
    const amount = s.price * qty;

    extrasRows += `
      <tr>
        <td>${s.name} <span class="gst-badge">GST 5%</span></td>
        <td class="text-center">${qty} day${qty > 1 ? "s" : ""}</td>
        <td class="text-right">₹${fmt(s.price)}</td>
        <td class="text-right">₹${fmt(amount)}</td>
      </tr>
    `;
  });

  /* =========================
     ROOM TOTALS (BACKEND TRUTH)
  ========================= */
  const roomTaxable = booking.taxable;
  const roomCGST = booking.cgst;
  const roomSGST = booking.sgst;
  const roomNetTotal = +(roomTaxable + roomCGST + roomSGST).toFixed(2);

  /* =========================
     FOOD
  ========================= */
  let foodRows = "";

  roomOrders.forEach((order) => {
    order.items.forEach((item: any) => {
      foodRows += `
        <tr>
          <td>${item.name}</td>
          <td class="text-center">${item.qty}</td>
          <td class="text-right">₹${fmt(item.unitPrice || item.totalPrice / item.qty)}</td>
          <td class="text-right">₹${fmt(item.totalPrice)}</td>
        </tr>
      `;
    });
  });

  const foodSubtotal = booking.foodTotals?.subtotal || 0;
  const foodDiscountAmount = booking.foodDiscountAmount || 0;
  const foodGST = booking.foodTotals?.gst || 0;
  const foodNetTotal = booking.foodTotals?.total || 0;

  /* =========================
     GRAND TOTAL / BALANCE
  ========================= */
  const grandTotal = +(roomNetTotal + foodNetTotal).toFixed(2);
  const balanceDue = finalPaymentReceived ? 0 : booking.balanceDue;

  /* =========================
     HTML
  ========================= */
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice</title>
  ${invoiceStyles}
</head>
<body>

<div class="invoice-container">

  ${finalPaymentReceived ? `<div class="paid-stamp">PAID</div>` : ""}

  <div class="header">
    <h1>${hotel.name}</h1>
    <p>${hotel.address}</p>
    <p>Phone: ${hotel.phone} | Email: ${hotel.email}</p>
    <p><strong>GSTIN:</strong> ${hotel.gstNumber}</p>
    <p style="font-size:18px;font-weight:bold;">TAX INVOICE</p>
  </div>

  ${buildGuestAndCompanySection(booking)}

  <!-- ROOM + EXTRAS -->
  <div class="section">
    <div class="section-title">Room Charges</div>

    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>

        <tr>
          <td>
            Room Charges <span class="gst-badge">GST 5%</span><br/>
            ${
              booking.pricingType === "FINAL_INCLUSIVE"
                ? "<small>(Offer Price – GST Inclusive)</small>"
                : ""
            }
          </td>
          <td class="text-center">${nights} nights</td>
          <td class="text-right">₹${fmt(perNightBase)}</td>
          <td class="text-right">₹${fmt(roomDisplayAmount)}</td>
        </tr>

        ${extrasRows}

        ${
          booking.discountAmount
            ? `
        <tr style="color:#d32f2f;">
          <td colspan="3" style="text-align:right;">
            Room Discount (${booking.discount}%)
          </td>
          <td class="text-right">- ₹${fmt(booking.discountAmount)}</td>
        </tr>`
            : ""
        }

        <tr style="font-weight:bold;">
          <td colspan="3" style="text-align:right;">Room Taxable Value</td>
          <td class="text-right">₹${fmt(roomTaxable)}</td>
        </tr>

        <tr>
          <td colspan="3" style="text-align:right;">CGST (2.5%)</td>
          <td class="text-right">₹${fmt(roomCGST)}</td>
        </tr>

        <tr>
          <td colspan="3" style="text-align:right;">SGST (2.5%)</td>
          <td class="text-right">₹${fmt(roomSGST)}</td>
        </tr>

      </tbody>
    </table>
  </div>

  <!-- FOOD -->
  ${
    foodRows
      ? `
  <div class="section">
    <div class="section-title">Food / Room Service</div>
    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${foodRows}
        <tr>
          <td colspan="3" style="text-align:right;">Food Subtotal</td>
          <td class="text-right">₹${fmt(foodSubtotal)}</td>
        </tr>
        <tr style="color:#d32f2f;">
          <td colspan="3" style="text-align:right;">
            Food Discount
          </td>
          <td class="text-right">- ₹${fmt(foodDiscountAmount)}</td>
        </tr>
        <tr>
          <td colspan="3" style="text-align:right;">Food GST</td>
          <td class="text-right">₹${fmt(foodGST)}</td>
        </tr>
        <tr style="font-weight:bold;">
          <td colspan="3" style="text-align:right;">Food Net Total</td>
          <td class="text-right">₹${fmt(foodNetTotal)}</td>
        </tr>
      </tbody>
    </table>
  </div>`
      : ""
  }

  <!-- FINAL SUMMARY -->
  <div class="section">
    <div class="section-title">Final Summary</div>

    <div class="total-row">
      <span>Room Net Total:</span>
      <span>₹${fmt(roomNetTotal)}</span>
    </div>

    <div class="total-row">
      <span>Food Net Total:</span>
      <span>₹${fmt(foodNetTotal)}</span>
    </div>

    <div class="total-row grand-total">
      <span>Grand Total:</span>
      <span>₹${fmt(grandTotal)}</span>
    </div>

    <div class="total-row">
      <span>Advance Paid:</span>
      <span>₹${fmt(booking.advancePaid)}</span>
    </div>

    ${
      finalPaymentReceived
        ? `
    <div class="total-row" style="color:#2e7d32;font-weight:bold;">
      <span>Final Payment Received (${finalPaymentMode || "Cash"}):</span>
      <span>₹${fmt(grandTotal)}</span>
    </div>`
        : `
    <div class="total-row grand-total" style="color:#d32f2f;">
      <span>Balance Due:</span>
      <span>₹${fmt(balanceDue)}</span>
    </div>`
    }
  </div>

  <div class="footer">
    <p>Thank you for choosing ${hotel.name}!</p>
    <div class="signature-box"><div class="signature-line">FRONT OFFICE MANAGER</div></div>
    <div class="signature-box"><div class="signature-line">CASHIER</div></div>
    <div class="signature-box"><div class="signature-line">Guest Sign.</div></div>
  </div>

</div>
</body>
</html>
`;
}

export function buildCombinedInvoice_old(invoice: any) {
  const fmt = (n: any) => Number(n || 0).toFixed(2);
  const guest = invoice.guest;
  const company = invoice.company;
  const stay = invoice.stay;
  /* =========================
     EXTRA SERVICES
  ========================= */
  let extrasRows = "";

  invoice.extraServices.forEach((s: any) => {
    extrasRows += `
      <tr>
        <td>
          ${s.name}
          ${
            s.gstEnabled
              ? `<span class="gst-badge">GST 5%</span>`
              : `<span class="gst-badge gst-exempt">GST Exempt</span>`
          }
        </td>
        <td class="text-center">${s.days} day${s.days > 1 ? "s" : ""}</td>
        <td class="text-right">₹${fmt(s.price)}</td>
        <td class="text-right">₹${fmt(s.total)}</td>
      </tr>
    `;
  });

  /* =========================
     FOOD ROWS
  ========================= */
  let foodRows = "";

  invoice.food.orders.forEach((order: any) => {
    order.items.forEach((item: any) => {
      foodRows += `
        <tr>
          <td>${item.name}</td>
          <td class="text-center">${item.qty}</td>
          <td class="text-right">₹${fmt(
            item.unitPrice ?? item.totalPrice / item.qty,
          )}</td>
          <td class="text-right">₹${fmt(item.totalPrice)}</td>
        </tr>
      `;
    });
  });
  const formatDateTime = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const guestAndCompanySection = `
  <!-- GUEST INFORMATION -->
  <div class="section">
    <div class="section-title">Guest Information</div>

    <div class="info-grid">
      <div><strong>Name:</strong> ${guest.name}</div>
      <div><strong>Phone:</strong> ${guest.phone}</div>
      ${guest.city ? `<div><strong>City:</strong> ${guest.city}</div>` : ""}
      ${
        guest.nationality
          ? `<div><strong>Nationality:</strong> ${guest.nationality}</div>`
          : ""
      }
      ${
        guest.address
          ? `<div><strong>Address:</strong> ${guest.address}</div>`
          : ""
      }
    </div>

   ${
     guest.ids?.length
       ? `
  <div style="margin-top:8px">
    <strong>ID Proof:</strong>
    <div style="margin-top:4px">
      ${guest.ids
        .map(
          (id: any) => `
        <div style="font-size:13px; margin-bottom:4px;">
          <strong>${id.type}:</strong> ${id.idNumber}
          ${id.nameOnId ? `(${id.nameOnId})` : ""}
        </div>
      `,
        )
        .join("")}
    </div>
  </div>
`
       : ""
   }

      
  </div>

  <!-- STAY DETAILS -->
  <div class="section">
    <div class="section-title">Stay Details</div>

    <div class="info-grid">
      <div><strong>Check-in:</strong> ${formatDateTime(stay.checkIn)}</div>
      <div><strong>Check-out:</strong> ${formatDateTime(stay.checkOut)}</div>
      <div><strong>Nights:</strong> ${stay.nights}</div>
      <div><strong>Room:</strong> ${stay.roomNumber} (${stay.roomType})</div>
    </div>
  </div>

  ${
    company
      ? `
  <!-- COMPANY DETAILS -->
  <div class="section">
    <div class="section-title">Company / Billing Details</div>

    <div class="company-box">
      <div class="info-item">
        <strong>Company Name:</strong> ${company.name}
      </div>
      ${
        company.gstin
          ? `<div class="info-item"><strong>GSTIN:</strong> ${company.gstin}</div>`
          : ""
      }
      ${
        company.address
          ? `<div class="info-item"><strong>Address:</strong> ${company.address}</div>`
          : ""
      }
    </div>
  </div>
  `
      : ""
  }
`;

  /* =========================
     HTML
  ========================= */
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice</title>
  ${invoiceStyles}
</head>

<body>

<div class="invoice-container">


  ${
    invoice.payments.finalPaymentReceived
      ? `<div class="paid-stamp">PAID</div>`
      : ""
  }

  <div class="header">
    <h1>${invoice.hotel.name}</h1>
    <p>${invoice.hotel.address}</p>
    <p>Phone: ${invoice.hotel.phone}</p>
    <p><strong>GSTIN:</strong> ${invoice.hotel.gstNumber}</p>
    <p class="title">ROOM TAX INVOICE</p>
  </div>
  

  ${guestAndCompanySection}


  <!-- ROOM + EXTRAS -->
  <div class="section">
    <div class="section-title">Room Charges</div>

    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>

        <tr>
          <td>
            Room Charges <span class="gst-badge">GST 5%</span>
          </td>
          <td class="text-center">
            ${invoice.stay.nights} night${invoice.stay.nights > 1 ? "s" : ""}
          </td>
          <td class="text-right">₹${fmt(invoice.stay.roomRate)}</td>
          <td class="text-right">₹${fmt(invoice.stay.stayAmount)}</td>
        </tr>

        ${extrasRows}

        <tr class="bold">
          <td colspan="3" style="text-align:right;">Room Taxable Value</td>
          <td class="text-right">₹${fmt(invoice.roomTax.taxable)}</td>
        </tr>

        <tr>
          <td colspan="3" style="text-align:right;">CGST (2.5%)</td>
          <td class="text-right">₹${fmt(invoice.roomTax.cgst)}</td>
        </tr>

        <tr>
          <td colspan="3" style="text-align:right;">SGST (2.5%)</td>
          <td class="text-right">₹${fmt(invoice.roomTax.sgst)}</td>
        </tr>

      </tbody>
    </table>
  </div>

  ${
    foodRows
      ? `
  <div class="section">
    <div class="section-title">Food / Room Service</div>
    <table class="table">
      <tbody>
        ${foodRows}
        <tr>
          <td colspan="3" style="text-align:right;">Food Net Total</td>
          <td class="text-right">₹${fmt(invoice.food.totals.total)}</td>
        </tr>
      </tbody>
    </table>
  </div>`
      : ""
  }

  <div class="section">
    <div class="section-title">Final Summary</div>

    <div class="total-row">
      <span>Room Net Total:</span>
      <span>₹${fmt(invoice.roomTax.roomNet)}</span>
    </div>

    <div class="total-row">
      <span>Food Net Total:</span>
      <span>₹${fmt(invoice.food.totals.total)}</span>
    </div>

    <div class="total-row grand-total">
      <span>Grand Total:</span>
      <span>₹${fmt(invoice.totals.grandTotal)}</span>
    </div>

    <div class="total-row">
      <span>Advance Paid:</span>
      <span>₹${fmt(invoice.payments.advancePaid)}</span>
    </div>

    ${
      invoice.payments.finalPaymentReceived
        ? `<div class="total-row paid">
             <span>Final Payment Received (${invoice.payments.finalPaymentMode}):</span>
             <span>₹${fmt(invoice.payments.finalPaymentAmount)}</span>
           </div>`
        : `<div class="total-row due">
             <span>Balance Due:</span>
             <span>₹${fmt(invoice.payments.balanceDue)}</span>
           </div>`
    }
  </div>

  <div class="footer">
    <p>Thank you for choosing ${invoice.hotel.name}!</p>
    <div class="signature">FRONT OFFICE MANAGER</div>
  </div>

</div>
</body>
</html>
`;
}

export function buildRoomInvoice_old(invoice: any) {
  const fmt = (n?: number) =>
    (typeof n === "number" ? n : 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const guest = invoice.guest;
  const company = invoice.company;
  const stay = invoice.stay;
  const hotel = invoice.hotel;

  /* ===============================
     EXTRA SERVICES (DISPLAY)
  =============================== */
  let extrasRows = "";

  invoice.extraServices.forEach((s: any) => {
    extrasRows += `
      <tr>
        <td>
          ${s.name}
          ${
            s.gstEnabled
              ? `<span class="gst-badge">GST 5%</span>`
              : `<span class="gst-badge gst-exempt">GST Exempt</span>`
          }
        </td>
        <td class="text-center">${s.days} day${s.days > 1 ? "s" : ""}</td>
        <td class="text-right">₹${fmt(s.price)}</td>
        <td class="text-right">₹${fmt(s.total)}</td>
      </tr>
    `;
  });

  /* ===============================
     DATE FORMATTER
  =============================== */
  const formatDateTime = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "—";

  /* ===============================
     GUEST + STAY + COMPANY (STYLED)
  =============================== */
  const guestAndCompanySection = `
  <div class="section">
    <div class="section-title">Guest Information</div>

    <div class="info-grid">
      <div><strong>Name:</strong> ${guest.name}</div>
      <div><strong>Phone:</strong> ${guest.phone}</div>
      ${guest.city ? `<div><strong>City:</strong> ${guest.city}</div>` : ""}
      ${
        guest.nationality
          ? `<div><strong>Nationality:</strong> ${guest.nationality}</div>`
          : ""
      }
      ${
        guest.address
          ? `<div><strong>Address:</strong> ${guest.address}</div>`
          : ""
      }
    </div>

    ${
      guest.ids?.length
        ? `
  <div style="margin-top:8px">
    <strong>ID Proof:</strong>
    <div style="margin-top:4px">
      ${guest.ids
        .map(
          (id: any) => `
        <div style="font-size:13px; margin-bottom:4px;">
          <strong>${id.type}:</strong> ${id.idNumber}
          ${id.nameOnId ? `(${id.nameOnId})` : ""}
        </div>
      `,
        )
        .join("")}
    </div>
  </div>`
        : ""
    }


  <div class="section">
    <div class="section-title">Stay Details</div>

    <div class="info-grid">
      <div><strong>Check-in:</strong> ${formatDateTime(stay.checkIn)}</div>
      <div><strong>Check-out:</strong> ${formatDateTime(stay.checkOut)}</div>
      <div><strong>Nights:</strong> ${stay.nights}</div>
      <div><strong>Room:</strong> ${stay.roomNumber} (${stay.roomType})</div>
    </div>
  </div>

  ${
    company
      ? `
  <div class="section">
    <div class="section-title">Company / Billing Details</div>

    <div class="company-box">
      <div class="info-item"><strong>Company Name:</strong> ${company.name}</div>
      ${
        company.gstin
          ? `<div class="info-item"><strong>GSTIN:</strong> ${company.gstin}</div>`
          : ""
      }
      ${
        company.address
          ? `<div class="info-item"><strong>Address:</strong> ${company.address}</div>`
          : ""
      }
    </div>
  </div>`
      : ""
  }
  `;

  /* ===============================
     HTML
  =============================== */
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

  ${
    invoice.payments.finalPaymentReceived
      ? `<div class="paid-stamp">PAID</div>`
      : ""
  }

  <div class="header">
    <h1>${hotel.name}</h1>
    <p>${hotel.address}</p>
    <p>Phone: ${hotel.phone}</p>
    <p><strong>GSTIN:</strong> ${hotel.gstNumber}</p>
    <p class="title">ROOM TAX INVOICE</p>
  </div>

  ${guestAndCompanySection}

  <!-- ================= BILLING DETAILS ================= -->
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
          <td class="text-center">${stay.nights} night${stay.nights > 1 ? "s" : ""}</td>
          <td class="text-right">₹${fmt(stay.roomRate)}</td>
          <td class="text-right">₹${fmt(stay.stayAmount)}</td>
        </tr>

        ${extrasRows}

        <tr style="font-weight:bold;">
          <td colspan="3" style="text-align:right;">Taxable Value</td>
          <td class="text-right">₹${fmt(invoice.roomTax.taxable)}</td>
        </tr>

        <tr>
          <td colspan="3" style="text-align:right;">CGST (2.5%)</td>
          <td class="text-right">₹${fmt(invoice.roomTax.cgst)}</td>
        </tr>

        <tr>
          <td colspan="3" style="text-align:right;">SGST (2.5%)</td>
          <td class="text-right">₹${fmt(invoice.roomTax.sgst)}</td>
        </tr>

      </tbody>
    </table>
  </div>

  <!-- ================= FINAL SUMMARY ================= -->
  <div class="section">
    <div class="section-title">Final Summary</div>

    <div class="total-row grand-total">
      <span>Room Grand Total:</span>
      <span>₹${fmt(invoice.roomTax.roomNet)}</span>
    </div>

    <div class="total-row">
      <span>Advance Paid:</span>
      <span>₹${fmt(invoice.payments.advancePaid)}</span>
    </div>

    ${
      invoice.payments.finalPaymentReceived
        ? `
      <div class="total-row paid">
        <span>Final Payment Received (${invoice.payments.finalPaymentMode}):</span>
        <span>₹${fmt(invoice.payments.finalPaymentAmount)}</span>
      </div>`
        : `
      <div class="total-row due">
        <span>Balance Due:</span>
        <span>₹${fmt(invoice.payments.balanceDue)}</span>
      </div>`
    }
  </div>

  <div class="footer">
    <p>Thank you for choosing ${hotel.name}!</p>
  </div>

</div>
</body>
</html>
`;
}
