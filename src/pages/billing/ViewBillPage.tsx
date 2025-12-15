import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getBillByIdApi, getRoomBillByIdApi } from "@/api/billApi";

export default function ViewBillPage() {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

const { type} = useParams();

const loadBill = async () => {
  try {
    let data: { success: any; bill: any; };

    if (type?.toLowerCase() === "room") {
      data = await getRoomBillByIdApi(billId!);
    } else {
      data = await getBillByIdApi(billId!);
    }

    if (data.success) {
      setBill(data.bill);
    } else {
      toast.error("Bill not found");
      navigate("/old-bills");
    }

  } catch {
    toast.error("Failed to load bill");
    navigate("/old-bills");
  }

  setLoading(false);
};

  useEffect(() => {
    loadBill();
  }, [billId]);

  if (loading)
    return (
      <Layout>
        <p className="p-10 text-center text-muted-foreground">Loading bill...</p>
      </Layout>
    );

  if (!bill)
    return (
      <Layout>
        <p className="p-10 text-center text-muted-foreground">Bill not found</p>
      </Layout>
    );

  const isRoom = bill.source === "ROOM";

  return (
    <Layout>
      <div className="space-y-6">

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/old-bills")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="text-3xl font-bold">Bill #{bill.billNumber}</h1>
            <p className="text-muted-foreground">
              Created on {new Date(bill.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* ------------------------------ */}
        {/* RESTAURANT BILL VIEW           */}
        {/* ------------------------------ */}
        {!isRoom && (
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Bill</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p><b>Customer:</b> {bill.customerName || "N/A"}</p>
                <p><b>Phone:</b> {bill.customerPhone || "N/A"}</p>
                <p><b>Table:</b> {bill.table_id?.name}</p>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h2 className="font-semibold text-lg">Items</h2>

                {bill.orders.map((order: any, idx: number) => (
                  <div key={idx} className="border p-3 rounded-md">
                    <h3 className="font-medium text-sm">Order #{String(order.order_id).slice(-4)}</h3>

                    <div className="mt-2 space-y-1 text-sm">
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.name} × {item.qty}</span>
                          <span>₹{item.totalPrice}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 text-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{bill.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span>₹{bill.gst}</span>
                </div>
                <div className="flex justify-between font-bold text-primary text-xl">
                  <span>Total</span>
                  <span>₹{bill.finalAmount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ------------------------------ */}
        {/* ROOM FINAL INVOICE VIEW        */}
        {/* ------------------------------ */}
{isRoom && (
  <Card>
    <CardHeader>
      <CardTitle>Room Invoice (Stay + Food)</CardTitle>
    </CardHeader>

    <CardContent className="space-y-6">

      {/* GUEST INFO */}
      <div className="space-y-1">
        <p><b>Guest:</b> {bill.fullInvoice.guestName}</p>
        <p><b>Phone:</b> {bill.fullInvoice.guestPhone}</p>
        <p><b>Room:</b> {bill.fullInvoice.roomNumber}</p>
        <p><b>Advance Payment Mode:</b> {bill.fullInvoice.advancePaymentMode || "N/A"}</p>

       {bill.fullInvoice.finalPaymentReceived && (
       <p><b>Final Payment Mode:</b> {bill.fullInvoice.finalPaymentMode || "N/A"}</p>
       )}
        <p><b>Checkout Time:</b> {new Date(bill.fullInvoice.actualCheckoutTime).toLocaleString()}</p>
      </div>

      {/* STAY CHARGES */}
      <div className="space-y-2">
        <h2 className="font-semibold text-lg mb-1">Stay Charges</h2>

        <div className="flex justify-between">
          <span>Room Rate</span>
          <span>₹{bill.fullInvoice.roomRate}</span>
        </div>

        <div className="flex justify-between">
          <span>Nights Stayed</span>
          <span>{bill.fullInvoice.stayNights}</span>
        </div>

        <div className="flex justify-between font-medium">
          <span>Room Amount (Rate × Nights)</span>
          <span>₹{bill.fullInvoice.stayAmount}</span>
        </div>

        {/* EXTRA SERVICES */}
        {bill.fullInvoice.extraServices.length > 0 && (
          <>
            <h3 className="font-semibold mt-3">Extra Services</h3>
            {bill.fullInvoice.extraServices.map((s: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{s.name}</span>
                <span>₹{s.price}</span>
              </div>
            ))}
          </>
        )}

        {/* ROOM GST */}
        <h3 className="font-semibold mt-3">GST on Stay</h3>
        <div className="flex justify-between text-sm">
          <span>CGST (2.5%)</span>
          <span>₹{bill.fullInvoice.stayCGST}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>SGST (2.5%)</span>
          <span>₹{bill.fullInvoice.staySGST}</span>
        </div>

        <div className="flex justify-between font-medium">
          <span>Total Stay GST</span>
          <span>₹{bill.fullInvoice.stayGST}</span>
        </div>
      </div>

      {/* DISCOUNT */}
      <div className="space-y-2">
        <h2 className="font-semibold text-lg">Discount</h2>
        <div className="flex justify-between">
          <span>Discount ({bill.fullInvoice.discountPercent}%)</span>
          <span>- ₹{bill.fullInvoice.discountAmount}</span>
        </div>
      </div>

      {/* FOOD SECTION */}
      <div className="space-y-2">
        <h2 className="font-semibold text-lg mb-1">Room Service / Food Orders</h2>

        {bill.fullInvoice.foodOrders.map((o: any, i: number) => (
          <div key={i} className="border rounded-md p-3 mb-2">
            <b>Order #{String(o.order_id).slice(-6)}</b>

            {o.items.map((item: any, n: number) => (
              <div key={n} className="flex justify-between text-sm mt-1">
                <span>{item.name} × {item.qty}</span>
                <span>₹{item.totalPrice}</span>
              </div>
            ))}

            <div className="flex justify-between text-sm mt-2">
              <span>GST</span>
              <span>₹{o.gst}</span>
            </div>
          </div>
        ))}

        <div className="flex justify-between">
          <span><b>Food Subtotal</b></span>
          <span>₹{bill.fullInvoice.foodSubtotal}</span>
        </div>

        <div className="flex justify-between">
          <span><b>Food GST</b></span>
          <span>₹{bill.fullInvoice.foodGST}</span>
        </div>

        <div className="flex justify-between font-medium">
          <span><b>Total Food Amount</b></span>
          <span>₹{bill.fullInvoice.foodTotal}</span>
        </div>
      </div>

      {/* ADVANCE + FINAL PAYMENTS */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span>Advance Paid</span>
          <span>₹{bill.fullInvoice.advancePaid}</span>
        </div>

        {bill.fullInvoice.finalPaymentReceived && (
          <div className="flex justify-between">
            <span>Final Payment ({bill.fullInvoice.finalPaymentMode})</span>
            <span>₹{bill.fullInvoice.finalPaymentAmount}</span>
          </div>
        )}
      </div>

      {/* GRAND TOTAL + BALANCE */}
      <div className="border-t pt-4 space-y-2 text-lg">
        <div className="flex justify-between font-bold">
          <span>Total Amount</span>
          <span>₹{bill.fullInvoice.totalAmount}</span>
        </div>

        <div className="flex justify-between text-primary text-xl font-bold">
          <span>Balance Due</span>
          <span>₹{bill.fullInvoice.balanceDue}</span>
        </div>
      </div>

    </CardContent>
  </Card>
)}


      </div>
    </Layout>
  );
}
