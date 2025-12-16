// utils/invoiceBuilder.ts
// Professional invoice HTML generator matching hotel invoice format

const fmt = (n?: number) =>
  (typeof n === "number" ? n : 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const escapeHtml = (s: any) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Common styles for all invoices
const invoiceStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      font-size: 11px;
      line-height: 1.4;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #000;
      padding: 15px;
      page-break-inside: avoid;
    }
    
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    
    .header h1 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    
    .header .subtitle {
      font-size: 9px;
      margin-bottom: 1px;
    }
    
    .header .gstin {
      font-size: 9px;
      margin-top: 3px;
    }
    
    .invoice-title {
      text-align: right;
      font-weight: bold;
      margin-bottom: 8px;
      font-size: 10px;
    }
    
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 9px;
    }
    
    .info-left, .info-right {
      width: 48%;
    }
    
    .info-row {
      margin-bottom: 2px;
    }
    
    .info-row strong {
      display: inline-block;
      width: 100px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 9px;
    }
    
    .items-table th {
      background-color: #d3d3d3;
      border: 1px solid #000;
      padding: 4px 3px;
      text-align: left;
      font-weight: bold;
    }
    
    .items-table td {
      border: 1px solid #000;
      padding: 4px 3px;
    }
    
    .items-table .text-right {
      text-align: right;
    }
    
    .items-table .text-center {
      text-align: center;
    }
    
    .section-heading {
      margin: 10px 0 5px 0;
      font-size: 11px;
      border-bottom: 1px solid #000;
      padding-bottom: 3px;
      font-weight: bold;
    }
    
    .totals-section {
      margin-top: 10px;
      border-top: 2px solid #000;
      padding-top: 8px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      font-size: 9px;
    }
    
    .totals-row.grand-total {
      font-weight: bold;
      font-size: 10px;
      margin-top: 5px;
      padding-top: 5px;
      border-top: 1px solid #000;
    }
    
    .payment-section {
      margin-top: 12px;
      padding: 8px;
      background-color: #f5f5f5;
      border: 1px solid #999;
    }
    
    .payment-table {
      width: 100%;
      font-size: 9px;
      margin-top: 5px;
    }
    
    .payment-table td {
      padding: 2px 5px;
    }
    
    .footer {
      margin-top: 15px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .signature-box {
      text-align: center;
    }
    
    .signature-line {
      border-top: 1px solid #000;
      width: 150px;
      margin-top: 30px;
      padding-top: 3px;
      font-size: 9px;
    }
    
    .terms {
      font-size: 8px;
      margin-top: 10px;
      padding: 5px;
      background-color: #f9f9f9;
      border: 1px dashed #999;
    }
    
    @media print {
      body { 
        padding: 0;
        margin: 0;
      }
      
      .invoice-container {
        page-break-inside: avoid;
        page-break-after: avoid;
        height: auto;
        max-height: 100vh;
        padding: 10px;
      }
      
      .no-print { 
        display: none; 
      }
      
      @page {
        size: A4;
        margin: 8mm;
      }
      
      /* Reduce spacing for print */
      .header {
        padding-bottom: 5px;
        margin-bottom: 8px;
      }
      
      .info-section {
        margin-bottom: 8px;
      }
      
      .items-table {
        margin: 8px 0;
        font-size: 8px;
      }
      
      .items-table th,
      .items-table td {
        padding: 3px 2px;
      }
      
      .section-heading {
        margin: 8px 0 4px 0;
        font-size: 10px;
      }
      
      .totals-section {
        margin-top: 8px;
        padding-top: 6px;
      }
      
      .payment-section {
        margin-top: 10px;
        padding: 6px;
      }
      
      .footer {
        margin-top: 12px;
      }
      
      .signature-line {
        margin-top: 20px;
      }
      
      .terms {
        margin-top: 8px;
        padding: 4px;
      }
      
      /* Prevent page breaks inside important sections */
      .header,
      .info-section,
      .items-table,
      .totals-section,
      .payment-section,
      .footer,
      .terms {
        page-break-inside: avoid;
      }
      
      /* Keep table rows together */
      .items-table tr {
        page-break-inside: avoid;
      }
    }
  </style>
`;

// Build header section
function buildInvoiceHeader(hotel: any, invoiceData: any) {
  return `
    <div class="header">
      <h1>${escapeHtml(hotel?.name || "HOTEL NAME")}</h1>
      <div class="subtitle">${escapeHtml(hotel?.address || "")}</div>
      <div class="subtitle">Mobile: ${escapeHtml(hotel?.phone || "")}</div>
      ${hotel?.email ? `<div class="subtitle">Email: ${escapeHtml(hotel.email)}</div>` : ""}
      <div class="gstin">GSTIN No.: ${escapeHtml(hotel?.gstNumber || "N/A")}</div>
      <div style="margin-top: 8px; font-weight: bold;">TAX INVOICE</div>
    </div>
    
    <div class="invoice-title">
      ${invoiceData.reprint ? "Reprint Bill" : ""}
    </div>
  `;
}

// Build guest information section
function buildGuestInfo(booking: any, invoiceData: any) {
  // Use current system date/time for checkout instead of booking.checkOut
  const currentDateTime = new Date().toLocaleString("en-IN", { 
    dateStyle: "short", 
    timeStyle: "short" 
  });
  
  return `
    <div class="info-section">
      <div class="info-left">
        <div class="info-row"><strong>Name:</strong> ${escapeHtml(booking.guestName)}</div>
        <div class="info-row"><strong>Address:</strong> ${escapeHtml(booking.guestAddress || "")}</div>
        <div class="info-row"><strong>City:</strong> ${escapeHtml(booking.guestCity || "")}</div>
        <div class="info-row"><strong>GSTIN No.:</strong> ${escapeHtml(booking.guestGSTIN || "")}</div>
        <div class="info-row"><strong>Mobile No.:</strong> ${escapeHtml(booking.guestPhone)}</div>
      </div>
      
      <div class="info-right">
        <div class="info-row"><strong>Bill No. & Date:</strong> ${escapeHtml(invoiceData.invoiceNumber)} - ${escapeHtml(invoiceData.date)}</div>
        <div class="info-row"><strong>GRC No.:</strong> ${escapeHtml(booking._id?.toString().slice(-4) || "")}</div>
        <div class="info-row"><strong>Room No./Type:</strong> ${escapeHtml(booking.room_id?.number)} / ${escapeHtml(booking.room_id?.type)}</div>
        <div class="info-row"><strong>PAX:</strong> Adult: ${booking.adults || 2}</div>
        <div class="info-row"><strong>Check-In:</strong> ${new Date(booking.checkIn).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</div>
        <div class="info-row"><strong>Check-Out:</strong> ${currentDateTime}</div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------
// ROOM INVOICE
// -----------------------------------------------------
export function buildRoomInvoice(
  booking: any, 
  hotel: any, 
  bill: any, 
  finalPaymentReceived: boolean = false,
  finalPaymentMode: string = "CASH"
) {
  const invoiceNumber = `ROOM-${booking._id?.toString().slice(-6)}`;
  const date = new Date().toLocaleDateString("en-IN");
  
  const invoiceData = {
    invoiceNumber,
    date,
    reprint: false
  };
  
  // Calculate final balance
  const finalBalance = finalPaymentReceived ? 0 : bill.balance;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Room Invoice - ${invoiceNumber}</title>
      ${invoiceStyles}
    </head>
    <body>
      <div class="invoice-container">
        ${buildInvoiceHeader(hotel, invoiceData)}
        ${buildGuestInfo(booking, invoiceData)}
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Particulars</th>
              <th class="text-center">PAX</th>
              <th class="text-right">Rate</th>
              <th class="text-right">HSN/SAC</th>
              <th class="text-right">CGST %</th>
              <th class="text-right">CGST Amt</th>
              <th class="text-right">SGST %</th>
              <th class="text-right">SGST Amt</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${date}</td>
              <td>Room Rent ${booking.planCode ? booking.planCode.split("_")[0] : "EP"} (Room: ${booking.room_id?.number})<br/>
                  ${bill.nights} Night(s) × ₹${fmt(bill.roomPrice)}</td>
              <td class="text-center">${booking.adults || 2}</td>
              <td class="text-right">₹${fmt(bill.roomStayTotal)}</td>
              <td class="text-right">996311</td>
              <td class="text-right">${booking.gstEnabled ? "2.50" : "0.00"}</td>
              <td class="text-right">₹${fmt(bill.roomCGST)}</td>
              <td class="text-right">${booking.gstEnabled ? "2.50" : "0.00"}</td>
              <td class="text-right">₹${fmt(bill.roomSGST)}</td>
              <td class="text-right">₹${fmt(bill.roomStayTotal)}</td>
            </tr>
            
            ${(booking.addedServices || []).map((s: any) => `
              <tr>
                <td>${date}</td>
                <td>${escapeHtml(s.name)}</td>
                <td class="text-center">-</td>
                <td class="text-right">₹${fmt(s.price)}</td>
                <td class="text-right">996311</td>
                <td class="text-right">0.00</td>
                <td class="text-right">₹0.00</td>
                <td class="text-right">0.00</td>
                <td class="text-right">₹0.00</td>
                <td class="text-right">₹${fmt(s.price)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        
        <div class="totals-section">
          <div class="totals-row">
            <span>SUB TOTAL:</span>
            <span>₹${fmt(bill.roomBase)}</span>
          </div>
          <div class="totals-row">
            <span>Tax Amount (CGST + SGST):</span>
            <span>₹${fmt(bill.roomCGST + bill.roomSGST)}</span>
          </div>
          <div class="totals-row">
            <span>Tax Before Amount:</span>
            <span>₹${fmt(bill.roomBase + bill.roomCGST + bill.roomSGST)}</span>
          </div>
          <div class="totals-row">
            <span>Discount (${booking.discount || 0}%):</span>
            <span>-₹${fmt(bill.roomDiscountAmount)}</span>
          </div>
          <div class="totals-row grand-total">
            <span>ROUND OFF NET AMOUNT:</span>
            <span>₹${fmt(bill.roomNet)}</span>
          </div>
        </div>
        
        <div class="payment-section">
          <strong>Payment Details:</strong>
          <table class="payment-table">
            <tr>
              <td><strong>Rec. No.</strong></td>
              <td><strong>Pay Type</strong></td>
              <td><strong>Rec. Date</strong></td>
              <td><strong>Rec. Amount</strong></td>
            </tr>
            <tr>
              <td>${booking._id?.toString().slice(-4)}</td>
              <td>${booking.advancePaymentMode || "CASH"}</td>
              <td>${new Date(booking.checkIn).toLocaleDateString("en-IN")}</td>
              <td>₹${fmt(booking.advancePaid)}</td>
            </tr>
            ${finalPaymentReceived ? `
            <tr>
              <td>${booking._id?.toString().slice(-4)}-F</td>
              <td>${finalPaymentMode}</td>
              <td>${new Date().toLocaleDateString("en-IN")}</td>
              <td>₹${fmt(bill.balance)}</td>
            </tr>
            ` : ''}
            <tr>
              <td colspan="3" style="text-align: right;"><strong>Total Net Amount:</strong></td>
              <td><strong>₹${fmt(bill.roomNet)}</strong></td>
            </tr>
            <tr>
              <td colspan="3" style="text-align: right;"><strong>BALANCE:</strong></td>
              <td style="color: ${finalBalance === 0 ? 'green' : 'red'};"><strong>₹${fmt(finalBalance)}</strong></td>
            </tr>
          </table>
        </div>
        
        <div class="terms">
          I AGREE THAT I AM RESPONSIBLE FOR THE FULL PAYMENT OF THIS BILL IN THE EVENTS, IF IT IS NOT PAID (BY THE COMPANY/ORGANISATION OR PERSON INDICATED)
        </div>
        
        <div class="footer">
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

// -----------------------------------------------------
// FOOD INVOICE
// -----------------------------------------------------
export function buildFoodInvoice(
  booking: any, 
  hotel: any, 
  bill: any, 
  roomOrders: any[],
  finalPaymentReceived: boolean = false,
  finalPaymentMode: string = "CASH"
) {
  const invoiceNumber = `FOOD-${booking._id?.toString().slice(-6)}`;
  const date = new Date().toLocaleDateString("en-IN");
  
  const invoiceData = {
    invoiceNumber,
    date,
    reprint: false
  };
  
  // Calculate food portion of final balance
  const foodBalance = finalPaymentReceived ? 0 : bill.foodTotal;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Food Invoice - ${invoiceNumber}</title>
      ${invoiceStyles}
    </head>
    <body>
      <div class="invoice-container">
        ${buildInvoiceHeader(hotel, invoiceData)}
        ${buildGuestInfo(booking, invoiceData)}
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Particulars</th>
              <th class="text-right">Amount</th>
              <th class="text-right">CGST %</th>
              <th class="text-right">CGST Amt</th>
              <th class="text-right">SGST %</th>
              <th class="text-right">SGST Amt</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${roomOrders.map((order: any) => `
              <tr>
                <td>${new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                <td>
                  <strong>Order #${order._id?.toString().slice(-6)}</strong><br/>
                  ${order.items.map((item: any) => 
                    `${escapeHtml(item.name)} × ${item.qty}`
                  ).join("<br/>")}
                </td>
                <td class="text-right">₹${fmt(order.total - (order.gst || 0))}</td>
                <td class="text-right">${booking.foodGSTEnabled ? "2.50" : "0.00"}</td>
                <td class="text-right">₹${fmt((order.gst || 0) / 2)}</td>
                <td class="text-right">${booking.foodGSTEnabled ? "2.50" : "0.00"}</td>
                <td class="text-right">₹${fmt((order.gst || 0) / 2)}</td>
                <td class="text-right">₹${fmt(order.total)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        
        <div class="totals-section">
          <div class="totals-row">
            <span>SUB TOTAL:</span>
            <span>₹${fmt(bill.foodSubtotalRaw)}</span>
          </div>
          <div class="totals-row">
            <span>Tax Amount (CGST + SGST):</span>
            <span>₹${fmt(bill.foodCGST + bill.foodSGST)}</span>
          </div>
          <div class="totals-row">
            <span>Discount (${booking.foodDiscount || 0}%):</span>
            <span>-₹${fmt(bill.foodDiscountAmount)}</span>
          </div>
          <div class="totals-row grand-total">
            <span>ROUND OFF NET AMOUNT:</span>
            <span>₹${fmt(bill.foodTotal)}</span>
          </div>
          ${finalPaymentReceived ? `
          <div class="totals-row" style="margin-top: 10px;">
            <span>Payment Received (${finalPaymentMode}):</span>
            <span style="color: green;">₹${fmt(bill.foodTotal)}</span>
          </div>
          <div class="totals-row grand-total" style="color: green;">
            <span>BALANCE DUE:</span>
            <span>₹0.00</span>
          </div>
          ` : `
          <div class="totals-row grand-total" style="color: red; margin-top: 10px;">
            <span>BALANCE DUE:</span>
            <span>₹${fmt(foodBalance)}</span>
          </div>
          `}
        </div>
        
        <div class="footer">
          <div class="signature-box">
            <div class="signature-line">Authorized Signature</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Guest Sign.</div>
          </div>
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

// -----------------------------------------------------
// COMBINED INVOICE
// -----------------------------------------------------
export function buildCombinedInvoice(
  booking: any, 
  hotel: any, 
  bill: any, 
  roomOrders: any[],
  finalPaymentReceived: boolean = false,
  finalPaymentMode: string = "CASH"
) {
  const invoiceNumber = `FINAL-${booking._id?.toString().slice(-6)}`;
  const date = new Date().toLocaleDateString("en-IN");
  
  const invoiceData = {
    invoiceNumber,
    date,
    reprint: false
  };
  
  // Calculate final balance
  const finalBalance = finalPaymentReceived ? 0 : bill.balance;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Final Invoice - ${invoiceNumber}</title>
      ${invoiceStyles}
    </head>
    <body>
      <div class="invoice-container">
        ${buildInvoiceHeader(hotel, invoiceData)}
        ${buildGuestInfo(booking, invoiceData)}
        
        <h3 class="section-heading">ROOM CHARGES</h3>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Particulars</th>
              <th class="text-right">Amount</th>
              <th class="text-right">CGST</th>
              <th class="text-right">SGST</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Room Rent (${bill.nights} nights × ₹${fmt(bill.roomPrice)})</td>
              <td class="text-right">₹${fmt(bill.roomStayTotal)}</td>
              <td class="text-right">₹${fmt(bill.roomCGST)}</td>
              <td class="text-right">₹${fmt(bill.roomSGST)}</td>
              <td class="text-right">₹${fmt(bill.roomStayTotal + bill.roomCGST + bill.roomSGST)}</td>
            </tr>
            ${(booking.addedServices || []).map((s: any) => `
              <tr>
                <td>${escapeHtml(s.name)}</td>
                <td class="text-right">₹${fmt(s.price)}</td>
                <td class="text-right">₹0.00</td>
                <td class="text-right">₹0.00</td>
                <td class="text-right">₹${fmt(s.price)}</td>
              </tr>
            `).join("")}
            <tr style="background-color: #f0f0f0; font-weight: bold;">
              <td>Room Subtotal</td>
              <td class="text-right">₹${fmt(bill.roomBase)}</td>
              <td class="text-right">₹${fmt(bill.roomCGST)}</td>
              <td class="text-right">₹${fmt(bill.roomSGST)}</td>
              <td class="text-right">₹${fmt(bill.roomGross)}</td>
            </tr>
            <tr>
              <td colspan="4" style="text-align: right;">Room Discount (${booking.discount || 0}%):</td>
              <td class="text-right" style="color: red;">-₹${fmt(bill.roomDiscountAmount)}</td>
            </tr>
            <tr style="font-weight: bold;">
              <td colspan="4" style="text-align: right;">Room Net Total:</td>
              <td class="text-right">₹${fmt(bill.roomNet)}</td>
            </tr>
          </tbody>
        </table>
        
        ${roomOrders.length > 0 ? `
          <h3 class="section-heading">FOOD & BEVERAGES</h3>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Order Details</th>
                <th class="text-right">Amount</th>
                <th class="text-right">CGST</th>
                <th class="text-right">SGST</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${roomOrders.map((order: any) => `
                <tr>
                  <td>
                    <strong>Order #${order._id?.toString().slice(-6)}</strong> - 
                    ${new Date(order.createdAt).toLocaleDateString("en-IN")}<br/>
                    <small>${order.items.map((i: any) => `${i.name} × ${i.qty}`).join(", ")}</small>
                  </td>
                  <td class="text-right">₹${fmt(order.total - (order.gst || 0))}</td>
                  <td class="text-right">₹${fmt((order.gst || 0) / 2)}</td>
                  <td class="text-right">₹${fmt((order.gst || 0) / 2)}</td>
                  <td class="text-right">₹${fmt(order.total)}</td>
                </tr>
              `).join("")}
              <tr style="background-color: #f0f0f0; font-weight: bold;">
                <td>Food Subtotal</td>
                <td class="text-right">₹${fmt(bill.foodSubtotalRaw)}</td>
                <td class="text-right">₹${fmt(bill.foodCGST)}</td>
                <td class="text-right">₹${fmt(bill.foodSGST)}</td>
                <td class="text-right">₹${fmt(bill.foodSubtotalRaw + bill.foodCGST + bill.foodSGST)}</td>
              </tr>
              <tr>
                <td colspan="4" style="text-align: right;">Food Discount (${booking.foodDiscount || 0}%):</td>
                <td class="text-right" style="color: red;">-₹${fmt(bill.foodDiscountAmount)}</td>
              </tr>
              <tr style="font-weight: bold;">
                <td colspan="4" style="text-align: right;">Food Net Total:</td>
                <td class="text-right">₹${fmt(bill.foodTotal)}</td>
              </tr>
            </tbody>
          </table>
        ` : ""}
        
        <div class="totals-section">
          <div class="totals-row grand-total">
            <span>GRAND TOTAL:</span>
            <span>₹${fmt(bill.grandTotal)}</span>
          </div>
          <div class="totals-row">
            <span>Advance Paid:</span>
            <span style="color: green;">₹${fmt(booking.advancePaid)}</span>
          </div>
          ${finalPaymentReceived ? `
          <div class="totals-row">
            <span>Final Payment (${finalPaymentMode}):</span>
            <span style="color: green;">₹${fmt(bill.balance)}</span>
          </div>
          <div class="totals-row grand-total" style="color: green;">
            <span>BALANCE DUE:</span>
            <span>₹0.00</span>
          </div>
          ` : `
          <div class="totals-row grand-total" style="color: red;">
            <span>BALANCE DUE:</span>
            <span>₹${fmt(finalBalance)}</span>
          </div>
          `}
        </div>
        
        <div class="payment-section">
          <strong>Payment History:</strong>
          <table class="payment-table">
            <tr>
              <td><strong>Date</strong></td>
              <td><strong>Payment Mode</strong></td>
              <td><strong>Amount</strong></td>
            </tr>
            <tr>
              <td>${new Date(booking.checkIn).toLocaleDateString("en-IN")}</td>
              <td>${booking.advancePaymentMode || "CASH"}</td>
              <td>₹${fmt(booking.advancePaid)}</td>
            </tr>
            ${finalPaymentReceived ? `
            <tr>
              <td>${new Date().toLocaleDateString("en-IN")}</td>
              <td>${finalPaymentMode}</td>
              <td>₹${fmt(bill.balance)}</td>
            </tr>
            <tr style="font-weight: bold; background-color: #e8f5e9;">
              <td colspan="2">Total Paid</td>
              <td>₹${fmt(bill.grandTotal)}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div class="terms">
          I AGREE THAT I AM RESPONSIBLE FOR THE FULL PAYMENT OF THIS BILL IN THE EVENTS, IF IT IS NOT PAID (BY THE COMPANY/ORGANISATION OR PERSON INDICATED)
        </div>
        
        <div class="footer">
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