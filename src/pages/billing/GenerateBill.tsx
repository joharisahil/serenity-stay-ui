import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/api/authApi";

/* ---------------- TYPES ---------------- */

type OrderItem = {
  item_id: string;
  order_id: string;
  name: string;
  size: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
};

type Order = {
  table_id: any;
  _id: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
};

/* ---------------- COMPONENT ---------------- */

export default function GenerateBill() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");


  /* -------- DISCOUNT -------- */
  const [discountInput, setDiscountInput] = useState("");
  const [discountPercentInput, setDiscountPercentInput] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  /* -------- GST -------- */
  const [applyCGST, setApplyCGST] = useState(true);
  const [applySGST, setApplySGST] = useState(true);

  /* -------- ROUND OFF -------- */
  const [enableRoundOff, setEnableRoundOff] = useState(true);

  /* -------- CHECKOUT -------- */
  const [loading, setLoading] = useState(false);
  const [transferBookingId, setTransferBookingId] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [customerCompanyName, setCustomerCompanyName] = useState("");
  const [customerCompanyGSTIN, setCustomerCompanyGSTIN] = useState("");

  /* ---------------- LOAD ORDERS ---------------- */

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingOrders(true);
        const res = await api.get(`/orders/by-table/${tableId}`);
        if (res.data.success) setOrders(res.data.orders);
        else toast.error("Failed to load orders");
      } catch {
        toast.error("Failed to load orders");
      } finally {
        setLoadingOrders(false);
      }
    };

    if (tableId) load();
  }, [tableId]);

  /* ---------------- EDIT ITEMS ---------------- */

  const updateItemQty = (orderId: string, index: number, delta: number) => {
    setOrders(prev =>
      prev.map(o => {
        if (o._id !== orderId) return o;

        const items = [...o.items];
        const newQty = items[index].qty + delta;

        if (newQty <= 0) {
          items.splice(index, 1);
        } else {
          items[index] = {
            ...items[index],
            qty: newQty,
            totalPrice: newQty * items[index].unitPrice
          };
        }

        const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
        return { ...o, items, subtotal, total: subtotal };
      })
    );
  };

  /* ---------------- CALCULATIONS ---------------- */

  const subtotal = orders.reduce((s, o) => s + o.subtotal, 0);

  const discountAmount = discountApplied
    ? +(subtotal * (discountPercent / 100)).toFixed(2)
    : 0;

  const taxableAmount = subtotal - discountAmount;

  const cgst = applyCGST ? +(taxableAmount * 0.025).toFixed(2) : 0;
  const sgst = applySGST ? +(taxableAmount * 0.025).toFixed(2) : 0;

  const gst = cgst + sgst;

  const grossTotal = taxableAmount + gst;

  const roundedTotal = enableRoundOff
    ? Math.round(grossTotal)
    : +grossTotal.toFixed(2);

  const roundOffAmount = +(roundedTotal - grossTotal).toFixed(2);

  const finalAmount = roundedTotal;

  useEffect(() => {
    const cash = Number(cashAmount || 0);
    const remaining = finalAmount - cash;

    if (remaining >= 0) {
      setUpiAmount(remaining.toFixed(2));
    }
  }, [cashAmount, finalAmount]);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await api.get("/room-bookings/active-today");
        if (res.data.success) setActiveRooms(res.data.rooms);
      } catch { }
    };
    loadRooms();
  }, []);

  const transferToRoom = async () => {
    if (!transferBookingId) {
      toast.error("Select a room to transfer");
      return;
    }

    setTransferring(true);
    try {
      const res = await api.post("/billing/restaurant/transfer", {
        bookingId: transferBookingId,
        tableId,
        items: buildFinalItems(),
        subtotal,
        discount: discountAmount,
        gst,
        finalAmount
      });

      if (!res.data.success) {
        toast.error(res.data.message);
        return;
      }

      toast.success("Food bill transferred to room");
      navigate("/billing");
    } catch (e) {
      toast.error("Transfer failed");
    } finally {
      setTransferring(false);
    }
  };

  /* ---------------- PRINT ---------------- */

  /* ---------------- PRINT (THERMAL) ---------------- */

  const printInvoice = (bill: any, hotel: any) => {
    const tableName = orders[0]?.table_id?.name || "N/A";

    const buildHtml = (copyType: "CAPTAIN COPY" | "CUSTOMER COPY") => `
<!doctype html>
<html>
<body style="font-family:monospace;font-size:12px;padding:6px;width:58mm">

<div style="text-align:center;font-weight:bold">
  ${hotel?.name || ""}
</div>

${hotel?.address ? `<div style="text-align:center">${hotel.address}</div>` : ""}
${hotel?.phone ? `<div style="text-align:center">Ph: ${hotel.phone}</div>` : ""}
${hotel?.gstNumber ? `<div style="text-align:center">GSTIN: ${hotel.gstNumber}</div>` : ""}

<hr/>

<div style="text-align:center;font-weight:bold">
  *** ${copyType} ***
</div>

<hr/>

<div><b>Bill No:</b> ${bill.billNumber}</div>
<div><b>Date:</b> ${new Date(bill.createdAt).toLocaleString()}</div>
<div><b>Guest:</b> ${bill.customerName || "N/A"}</div>
<div><b>Phone:</b> ${bill.customerPhone || "N/A"}</div>
${bill.customerCompanyName
  ? `<div><b>Company:</b> ${bill.customerCompanyName}</div>`
  : ""}

${bill.customerCompanyGSTIN
  ? `<div><b>Company GSTIN:</b> ${bill.customerCompanyGSTIN}</div>`
  : ""}
<div><b>Table:</b> ${tableName}</div>

<hr/>

${bill.orders
        .flatMap((o: any) => o.items)
        .map(
          (i: any) => `
<div style="display:flex;justify-content:space-between">
  <span>${i.name} (${i.size}) x ${i.qty}</span>
  <span>₹${i.totalPrice.toFixed(2)}</span>
</div>`
        )
        .join("")}

<hr/>

<div style="display:flex;justify-content:space-between">
  <span>Subtotal</span>
  <span>₹${bill.subtotal.toFixed(2)}</span>
</div>

<div style="display:flex;justify-content:space-between">
  <span>CGST (2.5%)</span>
  <span>₹${(bill.gst / 2).toFixed(2)}</span>
</div>

<div style="display:flex;justify-content:space-between">
  <span>SGST (2.5%)</span>
  <span>₹${(bill.gst / 2).toFixed(2)}</span>
</div>

<div style="display:flex;justify-content:space-between">
  <span>Discount</span>
  <span>-₹${bill.discount.toFixed(2)}</span>
</div>

<div style="display:flex;justify-content:space-between">
  <span>Round Off</span>
  <span>${roundOffAmount >= 0 ? "+" : ""}₹${roundOffAmount.toFixed(2)}</span>
</div>

<hr/>

<div style="display:flex;justify-content:space-between;font-weight:bold">
  <span>TOTAL</span>
  <span>₹${bill.finalAmount.toFixed(2)}</span>
</div>

<hr/>

<div style="text-align:center">
  ${copyType === "CUSTOMER COPY" ? "Thank You 🙏 Visit Again" : "For Internal Use"}
</div>

</body>
</html>
`;

    const w = window.open("", "_blank", "width=300,height=800");
    if (!w) return;

    w.document.write(`
${buildHtml("CAPTAIN COPY")}

<script>
  window.print();
  setTimeout(() => {
    document.body.innerHTML = \`${buildHtml("CUSTOMER COPY")}\`;
    window.print();
    setTimeout(() => window.close(), 300);
  }, 300);
</script>
`);
  };

  /* ---------------- CHECKOUT ---------------- */

  const buildFinalItems = () => {
    return orders.flatMap(o =>
      o.items.map(i => ({
        order_id: o._id,
        item_id: i.item_id,
        name: i.name,
        size: i.size,
        qty: i.qty,
        unitPrice: i.unitPrice,
        total: i.totalPrice
      }))
    );
  };

  const checkout = async () => {
    if (!customerName || !customerPhone) {
      toast.error("Enter customer details");
      return;
    }

    setLoading(true);
    try {
      const payments = [];

      if (Number(cashAmount) > 0)
        payments.push({ mode: "CASH", amount: Number(cashAmount) });

      if (Number(upiAmount) > 0)
        payments.push({ mode: "UPI", amount: Number(upiAmount) });
      const res = await api.post(`/billing/tables/${tableId}/checkout`, {
        customerName,
        customerPhone,
        customerCompanyName,
        customerCompanyGSTIN,
        payments,
        discount: discountAmount,
        items: buildFinalItems(),
        subtotal,
        gst,
        finalAmount
      });

      if (!res.data.success) {
        toast.error(res.data.message);
        return;
      }

      toast.success("Bill generated");
      printInvoice(res.data.bill, res.data.hotel);
      setTimeout(() => navigate("/billing"), 500);
    } catch {
      toast.error("Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/billing")}>
            <ArrowLeft />
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ORDERS */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {orders.map(o => (
                <Card key={o._id} className="p-4">
                  {o.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div>
                        {i.name} ({i.size})
                        <div className="flex gap-2 mt-1">
                          <Button size="sm" onClick={() => updateItemQty(o._id, idx, -1)}>-</Button>
                          <span>{i.qty}</span>
                          <Button size="sm" onClick={() => updateItemQty(o._id, idx, 1)}>+</Button>
                        </div>
                      </div>
                      <span>₹{i.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* SUMMARY */}
          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">

              <Input placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              <Input placeholder="Customer Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
              <Input
                placeholder="Company Name (Optional)"
                value={customerCompanyName}
                onChange={(e) => setCustomerCompanyName(e.target.value)}
              />

              <Input
                placeholder="Company GSTIN (Optional)"
                value={customerCompanyGSTIN}
                onChange={(e) => setCustomerCompanyGSTIN(e.target.value)}
              />

              <div className="space-y-2">
                <Label>Payment Split</Label>

                <div className="flex justify-between items-center">
                  <span>Cash</span>
                  <Input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-32"
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span>UPI</span>
                  <Input
                    type="number"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(e.target.value)}
                    className="w-32"
                    placeholder="0"
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  Total Paid: ₹{(Number(cashAmount || 0) + Number(upiAmount || 0)).toFixed(2)}
                </div>
              </div>


              <div>
                <Label>
                  Discount (%)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={discountPercentInput}
                    onChange={(e) => {
                      setDiscountPercentInput(e.target.value);
                      setDiscountApplied(false);
                    }}
                  />

                  <Button variant="outline"
                    onClick={() => {
                      const value = Number(discountPercentInput);

                      if (isNaN(value) || value < 0 || value > 100) {
                        toast.error("Invalid discount percentage");
                        return;
                      }

                      setDiscountPercent(value);
                      setDiscountApplied(true);
                    }}

                  >
                    Apply
                  </Button>
                </div>
                {discountApplied &&
                  (<p className="text-sm text-muted-foreground mt-1">
                    Discount Amount: ₹{discountAmount.toFixed(2)} </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label>GST</Label>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2">
                    {/* <input
                      type="checkbox"
                      checked={applyCGST}
                      onChange={(e) => setApplyCGST(e.target.checked)}
                    /> */}
                    CGST (2.5%)
                  </label>
                  <span>₹{cgst.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2">
                    {/* <input
                      type="checkbox"
                      checked={applySGST}
                      onChange={(e) => setApplySGST(e.target.checked)}
                    /> */}
                    SGST (2.5%)
                  </label>
                  <span>₹{sgst.toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t pt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{finalAmount.toFixed(2)}</span>
                </div>
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={enableRoundOff}
                  onChange={e => setEnableRoundOff(e.target.checked)}
                />
                Round Off
              </label>

              <div className="font-bold">Total ₹{finalAmount}</div>

              <div className="border-t pt-4 space-y-2">
                <Label>Transfer to Room</Label>

                <Select
                  value={transferBookingId}
                  onValueChange={setTransferBookingId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select occupied room" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeRooms.map(r => (
                      <SelectItem key={r.booking._id} value={r.booking._id}>
                        Room {r.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={transferToRoom}
                  disabled={transferring}
                >
                  {transferring ? "Transferring..." : "Transfer Food Bill to Room"}
                </Button>
              </div>


              <Button className="w-full" onClick={checkout} disabled={loading}>
                {loading ? "Processing..." : <><Printer className="mr-2" />Print & Complete</>}
              </Button>

            </CardContent>
          </Card>

        </div>
      </div>
    </Layout>
  );
}
