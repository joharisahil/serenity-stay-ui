// src/pages/GenerateBill.tsx
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getRestaurantTableBillApi,
  checkoutRestaurantBillApi
} from "@/api/billingRestaurantApi";

export default function GenerateBill() {
  const { tableId } = useParams<{ tableId?: string }>();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    subtotal: 0,
    gst: 0,
    total: 0
  });

  const [discount, setDiscount] = useState<string>("");
  const [finalAmount, setFinalAmount] = useState(0);

  // NEW FIELDS
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [loading, setLoading] = useState(false);

  // Load bill
  const loadBill = async () => {
    if (!tableId) return;
    try {
      const data = await getRestaurantTableBillApi(tableId);
      if (data.success) {
        setOrders(data.orders);
        setSummary(data.summary);
      } else {
        toast.error(data.message || "Failed to load bill");
      }
    } catch (err) {
      toast.error("Failed to load bill");
    }
  };

  useEffect(() => {
    loadBill();
  }, [tableId]);

  // Update Final
  useEffect(() => {
    const disc = discount === "" ? 0 : Number(discount);
    setFinalAmount(Number((summary.total - disc).toFixed(2)));
  }, [discount, summary]);

  // --- Print helper: open new window and render invoice ---
  const openPrintWindow = (bill: any, hotel: any) => {
    const w = window.open("", "_blank", "width=900,height=1000,scrollbars=yes");
    if (!w) {
      toast.error("Popup blocked. Allow popups for this site to print.");
      return;
    }

    const styles = `
  <style>
    /* THERMAL PRINTER OPTIMIZED (58mm / 80mm) */
    body {
      font-family: monospace;
      font-size: 12px;
      padding: 0;
      margin: 0;
    }

    .invoice {
      width: 260px;   /* 58mm roll width */
      padding: 4px 8px;
      page-break-after: always;
      border: none;   /* remove borders for thermal */
    }

    .header {
      text-align: center;
      margin-bottom: 8px;
    }

    .brand {
      font-size: 14px;
      font-weight: bold;
    }

    .small, .muted {
      font-size: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }

    th, td {
      padding: 3px 0;
      font-size: 12px;
    }

    th {
      border-bottom: 1px dashed #000;
    }

    td.right {
      text-align: right;
    }

    .totals div {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 12px;
    }

    .bold {
      font-weight: bold;
    }

    @media print {
      .no-print { display:none; }
      body { margin:0; }
    }
  </style>
`;


    // helper to render items rows
    const rowsHtml = (ordersArr: any[]) => {
      // Flatten items from orders
      const allItems: any[] = [];
      for (const o of ordersArr) {
        for (const it of o.items) {
          allItems.push({
            name: it.name,
            size: it.size,
            qty: it.qty,
            price: (it.unitPrice ?? it.totalPrice / (it.qty || 1)),
            total: it.totalPrice
          });
        }
      }

      // aggregate items by name+size
      const aggregated: Record<string, any> = {};
      for (const it of allItems) {
        const key = `${it.name}||${it.size}`;
        if (!aggregated[key]) aggregated[key] = { ...it, qty: 0, total: 0 };
        aggregated[key].qty += it.qty;
        aggregated[key].total += it.total;
      }

      let html = "";
      let index = 1;
      for (const key of Object.keys(aggregated)) {
        const it = aggregated[key];
        html += `
          <tr>
            <td>${index++}. ${escapeHtml(it.name)} ${it.size ? `(${escapeHtml(it.size)})` : ""}</td>
            <td class="right">${it.qty}</td>
            <td class="right">₹${Number(it.price).toFixed(2)}</td>
            <td class="right">₹${Number(it.total).toFixed(2)}</td>
          </tr>
        `;
      }
      return html;
    };

    const escapeHtml = (s: any) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const invoiceHtml = (copyLabel: string) => `
      <div class="invoice">
        <div class="header">
  <div class="brand">${escapeHtml(hotel.name)}</div>
  <div class="small">${escapeHtml(hotel.address)}</div>
  <div class="small">${escapeHtml(hotel.phone)}</div>

  <div class="muted">${copyLabel}</div>
  <div class="muted">Invoice: ${escapeHtml(bill.billNumber)}</div>
  <div class="muted">Date: ${new Date(bill.createdAt).toLocaleString()}</div>
  ${bill.table_id && bill.table_id.name
    ? `<div class="muted">Table: ${escapeHtml(bill.table_id.name)}</div>`
    : ""}
</div>


        <div style="display:flex; justify-content:space-between; gap:12px; margin-top:8px">
          <div>
            <div class="muted">Customer</div>
            <div>${escapeHtml(bill.customerName || "-")}</div>
            <div class="muted">${escapeHtml(bill.customerPhone || "-")}</div>
          </div>
          <div style="text-align:right">
            <div class="muted">Payment</div>
            <div>${escapeHtml(bill.paymentMode || "-")}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align:left">Item</th>
              <th style="width:60px" class="right">Qty</th>
              <th style="width:110px" class="right">Rate</th>
              <th style="width:120px" class="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml(bill.orders)}
          </tbody>
        </table>

        <div class="totals">
          <div><span class="muted">Subtotal</span><span>₹${Number(bill.subtotal).toFixed(2)}</span></div>
          <div><span class="muted">GST</span><span>₹${Number(bill.gst).toFixed(2)}</span></div>
          <div><span class="muted">Discount</span><span>- ₹${Number(bill.discount || 0).toFixed(2)}</span></div>
          <div class="bold"><span>Total</span><span>₹${Number(bill.finalAmount).toFixed(2)}</span></div>
        </div>

        <div style="margin-top:12px" class="muted">
          Thank you for dining with us.
        </div>

        <div style="margin-top:20px; font-size:12px; display:flex; gap:12px;">
          <div style="flex:1"><strong>Restaurant copy</strong></div>
          <div style="flex:1"><strong>Customer copy</strong></div>
        </div>
      </div>
    `;

    // Write full page with two copies (restaurant + customer)
    w.document.open();
    w.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Invoice ${escapeHtml(bill.billNumber)}</title>
          ${styles}
        </head>
        <body>
          ${invoiceHtml("Restaurant Copy")}
          ${invoiceHtml("Customer Copy")}
          <div style="text-align:center; margin-top:12px" class="no-print">
            <button onclick="window.print()">Print</button>
          </div>
        </body>
      </html>
    `);
    w.document.close();

    // Wait until window loads then print
    const tryPrint = () => {
      try {
        w.focus();
        w.print();
        // optionally close after printing — comment this if you want to let user review
        // w.close();
      } catch (err) {
        // ignore
      }
    };

    // give the new window a short delay to render resources
    setTimeout(tryPrint, 500);
  };

  // --- Generate Bill: call API, then open print window with returned bill ---
  const generateBill = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Please enter customer details");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        table_id: tableId,
        discount: discount === "" ? 0 : Number(discount),
        paymentMode,
        customerName,
        customerPhone
      };

      const data = await checkoutRestaurantBillApi(payload);

      if (data.success) {
        toast.success("Bill generated successfully!");

        const bill = data.bill;
        const hotel = data.hotel;

        // Pass hotel details to print window
        openPrintWindow(bill, data.hotel);

        setTimeout(() => navigate("/billing"), 800);
      }
      else {
        toast.error(data.message || "Failed to generate bill");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/billing")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Generate Bill</h1>
            <p className="text-muted-foreground">Table Billing Summary</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* ORDER LIST */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Delivered Orders</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {orders.length === 0 && (
                <p className="text-center text-muted-foreground py-6">
                  No delivered orders found
                </p>
              )}

              {orders.map((order) => (
                <Card key={order._id} className="p-4 border">
                  <h3 className="font-semibold">Order #{String(order._id).slice(-4)}</h3>

                  <div className="mt-3 space-y-2">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {item.name} ({item.size}) × {item.qty}
                        </span>
                        <span>₹{item.totalPrice}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-3 text-sm">
                    <span className="font-medium">Order Total</span>
                    <span className="font-semibold text-primary">₹{order.total}</span>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* SUMMARY */}
          <Card>
            <CardHeader>
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

              {/* CUSTOMER DETAILS */}
              <div>
                <Label>Customer Name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer's full name"
                />
              </div>

              <div>
                <Label>Customer Phone</Label>
                <Input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter customer's phone number"
                />
              </div>

              <div>
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* SUBTOTAL */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{summary.subtotal}</span>
              </div>

              {/* GST */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST (5%)</span>
                <span className="font-medium">₹{summary.gst}</span>
              </div>

              {/* DISCOUNT */}
              <div className="space-y-2">
                <Label>Discount</Label>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="Enter discount amount"
                />
              </div>

              {/* FINAL */}
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>Final Total</span>
                <span className="text-primary">₹{finalAmount}</span>
              </div>

              <div className="space-y-2">
                <Button className="w-full" onClick={generateBill} disabled={loading}>
                  <Printer className="mr-2 h-4 w-4" />
                  {loading ? "Generating..." : "Print Invoice & Complete Payment"}
                </Button>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </Layout>
  );
}
