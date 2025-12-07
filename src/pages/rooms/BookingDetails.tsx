import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Edit, CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getBookingByRoomApi } from "@/api/bookingApi";
import { getRoomServiceBillApi } from "@/api/billingRestaurantApi";

export default function BookingDetails() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [invoiceModal, setInvoiceModal] = useState(false);

  const [booking, setBooking] = useState<any>(null);
  const [roomOrders, setRoomOrders] = useState<any[]>([]);
  const [roomOrderSummary, setRoomOrderSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // LOAD BOOKING + ROOM SERVICE ORDERS
  useEffect(() => {
    if (!roomId) return;

    const load = async () => {
      try {
        const res = await getBookingByRoomApi(roomId);
        setBooking(res.booking || null);

        const foodRes = await getRoomServiceBillApi(roomId);
        if (foodRes.success) {
          setRoomOrders(foodRes.orders || []);
          setRoomOrderSummary(foodRes.summary || null);
        }

      } catch (e) {
        toast.error("Failed to load booking details");
      }

      setLoading(false);
    };

    load();
  }, [roomId]);

  if (loading) return <Layout><p className="p-6">Loading...</p></Layout>;

  if (!booking)
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-xl font-bold">No active booking for this room</h1>
          <Button className="mt-4" onClick={() => navigate("/rooms")}>
            Back to Rooms
          </Button>
        </div>
      </Layout>
    );

  // ----- Stay Billing -----
  const nights = Math.max(
    1,
    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  let roomPrice = 0;
  if (booking.room_id?.plans && booking.planCode) {
    const [planCode, type] = booking.planCode.split("_");
    const plan = booking.room_id.plans.find((p: any) => p.code === planCode);
    if (plan) roomPrice = type === "SINGLE" ? plan.singlePrice : plan.doublePrice;
  }

  const roomStayTotal = roomPrice * nights;
  const serviceExtraTotal = (booking.addedServices || []).reduce(
    (sum: number, s: any) => sum + (s.price || 0),
    0
  );

  // ----- Food Billing -----
  const foodSubtotal = roomOrderSummary?.subtotal || 0;
  const foodGST = roomOrderSummary?.gst || 0;
  const foodTotal = roomOrderSummary?.total || 0;

  // ----- FINAL TOTAL -----
  const subtotal = roomStayTotal + serviceExtraTotal + foodTotal;
  const tax = subtotal * 0.18;
  const total = subtotal - (booking.discount || 0) + tax;
  const balance = total - booking.advancePaid;

  // Print helper
const printHTML = (html: string) => {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  printWindow!.document.write(html);
  printWindow!.document.close();
  printWindow!.focus();
  printWindow!.print();
};

// ROOM INVOICE ONLY
const printRoomInvoice = () => {
  const html = `
    <html>
      <head>
        <title>Room Invoice</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          h2 { margin-bottom: 5px; }
          .row { display:flex; justify-content:space-between; margin: 6px 0; }
          .divider { border-top:1px solid #aaa; margin:12px 0; }
        </style>
      </head>
      <body>
        <h2>Room Stay Invoice</h2>
        <p><strong>Room:</strong> ${booking.room_id.number}</p>
        <p><strong>Guest:</strong> ${booking.guestName}</p>
        <p><strong>Check-in:</strong> ${new Date(booking.checkIn).toDateString()}</p>
        <p><strong>Check-out:</strong> ${new Date(booking.checkOut).toDateString()}</p>

        <div class="divider"></div>

        <div class="row"><span>Room (${nights} nights × ₹${roomPrice})</span><span>₹${roomStayTotal}</span></div>

        ${booking.addedServices
          ?.map((s: any) => `<div class='row'><span>${s.name}</span><span>₹${s.price}</span></div>`)
          .join("")}

        <div class='divider'></div>

        <div class='row'><strong>Total</strong><strong>₹${roomStayTotal + serviceExtraTotal}</strong></div>
      </body>
    </html>
  `;
  printHTML(html);
};

// FOOD INVOICE ONLY
const printFoodInvoice = () => {
  const html = `
    <html>
      <head>
        <title>Food Invoice</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          h2 { margin-bottom: 5px; }
          .row { display:flex; justify-content:space-between; margin: 6px 0; }
          .divider { border-top:1px solid #aaa; margin:12px 0; }
        </style>
      </head>
      <body>
        <h2>Food / Room Service Invoice</h2>
        <p><strong>Room:</strong> ${booking.room_id.number}</p>
        <p><strong>Guest:</strong> ${booking.guestName}</p>

        <div class="divider"></div>

        ${roomOrders
          .map(
            (o: any) => `
            <h4>Order #${o._id}</h4>
            <p><small>${new Date(o.createdAt).toLocaleString()}</small></p>

            ${o.items
              .map(
                (i: any) =>
                  `<div class='row'><span>${i.name} (${i.qty} × ₹${i.unitPrice})</span><span>₹${i.totalPrice}</span></div>`
              )
              .join("")}

            <div class='row'><span>GST</span><span>₹${o.gst}</span></div>
            <div class="divider"></div>
        `
          )
          .join("")}

        <div class='row'><strong>Total Food Amount</strong><strong>₹${foodTotal}</strong></div>
      </body>
    </html>
  `;
  printHTML(html);
};

// COMBINED INVOICE
const printCombinedInvoice = () => {
  const html = `
    <html>
      <head>
        <title>Full Invoice</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          h2 { margin-bottom: 5px; }
          .row { display:flex; justify-content:space-between; margin: 6px 0; }
          .divider { border-top:1px solid #aaa; margin:12px 0; }
          .section-title { font-size: 18px; font-weight: bold; margin-top: 14px; }
        </style>
      </head>

      <body>
        <h2>Complete Stay Invoice</h2>
        <p><strong>Room:</strong> ${booking.room_id.number}</p>
        <p><strong>Guest:</strong> ${booking.guestName}</p>

        <!-- ROOM SECTION -->
        <div class="section-title">Room Stay Charges</div>
        <div class='row'><span>Room (${nights} nights × ₹${roomPrice})</span><span>₹${roomStayTotal}</span></div>
        ${booking.addedServices
          ?.map((s: any) => `<div class='row'><span>${s.name}</span><span>₹${s.price}</span></div>`)
          .join("")}

        <div class="divider"></div>

        <!-- FOOD SECTION -->
        <div class="section-title">Room Service Orders</div>

        ${roomOrders
          .map(
            (o: any) => `
            <h4>Order #${o._id}</h4>
            <p><small>${new Date(o.createdAt).toLocaleString()}</small></p>

            ${o.items
              .map(
                (i: any) =>
                  `<div class='row'><span>${i.name} (${i.qty} × ₹${i.unitPrice})</span><span>₹${i.totalPrice}</span></div>`
              )
              .join("")}

            <div class='row'><span>GST</span><span>₹${o.gst}</span></div>
            <div class="divider"></div>
          `
          )
          .join("")}

        <!-- TOTAL SUMMARY -->
        <div class='row'><strong>Grand Total</strong><strong>₹${total}</strong></div>
        <div class='row'><strong>Advance Paid</strong><strong>₹${booking.advancePaid}</strong></div>
        <div class='row'><strong>Balance</strong><strong>₹${balance}</strong></div>

      </body>
    </html>
  `;
  printHTML(html);
};


  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/rooms")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div>
              <h1 className="text-3xl font-bold">Booking Details</h1>
              <p className="text-muted-foreground">
                Room {booking.room_id?.number} — {booking.room_id?.type}
              </p>
            </div>
          </div>

          <Badge className="bg-room-occupied text-white">Occupied</Badge>
        </div>

        {/* GUEST INFO */}
        <Card>
          <CardHeader><CardTitle>Guest Information</CardTitle></CardHeader>
          <CardContent>
            <p><strong>Name:</strong> {booking.guestName}</p>
            <p><strong>Phone:</strong> {booking.guestPhone}</p>
            <p><strong>Adults:</strong> {booking.adults}</p>
            <p><strong>Children:</strong> {booking.children}</p>
          </CardContent>
        </Card>

        {/* STAY DETAILS */}
        <Card>
          <CardHeader><CardTitle>Stay Details</CardTitle></CardHeader>
          <CardContent>
            <p><strong>Check-in:</strong> {new Date(booking.checkIn).toDateString()}</p>
            <p><strong>Check-out:</strong> {new Date(booking.checkOut).toDateString()}</p>
            <p><strong>Nights:</strong> {nights}</p>
          </CardContent>
        </Card>

{/* BILLING SUMMARY */}
<Card>
  <CardHeader>
    <CardTitle>Billing Summary</CardTitle>
  </CardHeader>

  <CardContent>
    <div className="space-y-4">

      {/* ROOM STAY */}
      <div className="flex justify-between">
        <span className="font-medium">Room ({nights} nights × ₹{roomPrice})</span>
        <span>₹{roomStayTotal}</span>
      </div>

      {/* EXTRA SERVICES */}
      {(booking.addedServices || []).map((s: any, i: number) => (
        <div key={i} className="flex justify-between">
          <span>{s.name}</span>
          <span>₹{s.price}</span>
        </div>
      ))}

      {/* --------------------------- */}
      {/* ROOM SERVICE ORDERS SECTION */}
      {/* --------------------------- */}
      {roomOrders.length > 0 && (
        <>
          <div className="pt-4 border-t">
            <h3 className="text-primary font-semibold mb-2">Room Service Orders</h3>
          </div>

          {roomOrders.map((order: any, index: number) => (
            <div
              key={index}
              className="border rounded-lg p-3 bg-secondary/20 space-y-2"
            >
              {/* ORDER HEADER */}
              <div className="flex justify-between font-medium">
                <span>Order #{order._id}</span>
                <span>₹{order.total}</span>
              </div>

              {/* ORDER DATE */}
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Ordered At:</span>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>

              {/* ORDER ITEMS */}
              <div className="pt-1 space-y-1">
                {order.items.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {item.name} ({item.qty} × ₹{item.unitPrice})
                    </span>
                    <span>₹{item.totalPrice}</span>
                  </div>
                ))}
              </div>

              {/* GST */}
              <div className="flex justify-between text-sm text-muted-foreground border-t pt-1">
                <span>GST (5%)</span>
                <span>₹{order.gst}</span>
              </div>
            </div>
          ))}

          {/* FOOD BILL SUMMARIES */}
          <div className="space-y-1 pt-2">
            <div className="flex justify-between font-medium">
              <span>Food Subtotal</span>
              <span>₹{foodSubtotal}</span>
            </div>

            <div className="flex justify-between font-medium">
              <span>Food GST</span>
              <span>₹{foodGST}</span>
            </div>

            <div className="flex justify-between font-bold">
              <span>Food Total</span>
              <span>₹{foodTotal}</span>
            </div>
          </div>
        </>
      )}

      {/* --------------------------- */}
      {/* MAIN BILL TOTALS */}
      {/* --------------------------- */}
      <div className="flex justify-between border-t pt-4">
        <span className="font-medium">Subtotal</span>
        <span>₹{subtotal}</span>
      </div>

      <div className="flex justify-between">
        <span>Discount</span>
        <span>- ₹{booking.discount || 0}</span>
      </div>

      <div className="flex justify-between">
        <span>GST (18% on stay + extras)</span>
        <span>₹{tax}</span>
      </div>

      <div className="flex justify-between text-lg font-bold border-t pt-2">
        <span>Total</span>
        <span>₹{total}</span>
      </div>

      <div className="flex justify-between text-success">
        <span>Advance Paid</span>
        <span>₹{booking.advancePaid}</span>
      </div>

      <div className="flex justify-between text-lg font-bold border-t pt-2">
        <span>Balance Due</span>
        <span className="text-warning">₹{balance}</span>
      </div>

    </div>
  </CardContent>
</Card>


        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-4">
          <Button><CheckCircle className="mr-2 h-4 w-4" /> Mark Check-out</Button>
          <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Change Room</Button>
          <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Extend Stay</Button>
          <Button variant="outline" onClick={() => setInvoiceModal(true)}>
  <Download className="mr-2 h-4 w-4" /> Download Invoice
</Button>

        </div>

      </div>
      <Dialog open={invoiceModal} onOpenChange={setInvoiceModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Select Invoice Type</DialogTitle>
    </DialogHeader>

    <div className="space-y-3 py-3">
      <Button className="w-full" onClick={printRoomInvoice}>
        Room Invoice Only
      </Button>

      <Button className="w-full" onClick={printFoodInvoice} disabled={roomOrders.length === 0}>
        Food Invoice Only
      </Button>

      <Button className="w-full" onClick={printCombinedInvoice}>
        Full Invoice (Room + Food)
      </Button>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setInvoiceModal(false)}>
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    </Layout>
  );
}
