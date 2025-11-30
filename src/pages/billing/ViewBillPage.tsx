import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";
import { getBillByIdApi } from "@/api/billApi";
import { openPrintWindow } from "@/utils/printInvoice";

export default function ViewBillPage() {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadBill = async () => {
    try {
      const data = await getBillByIdApi(billId!);
      if (data.success) {
        setBill(data.bill);
      } else {
        toast.error("Bill not found");
        navigate("/billing");
      }
    } catch (err) {
      toast.error("Failed to load bill");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBill();
  }, [billId]);

  if (loading) {
    return (
      <Layout>
        <p className="p-10 text-center text-muted-foreground">Loading bill...</p>
      </Layout>
    );
  }

  if (!bill) {
    return (
      <Layout>
        <p className="p-10 text-center text-muted-foreground">Bill not found</p>
      </Layout>
    );
  }

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

        <Card>
          <CardHeader>
            <CardTitle>Bill Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* Customer Info */}
            <div className="space-y-1">
              <p><b>Customer:</b> {bill.customerName || "N/A"}</p>
              <p><b>Phone:</b> {bill.customerPhone || "N/A"}</p>
              <p><b>Payment Mode:</b> {bill.paymentMode}</p>
              <p><b>Table:</b> {bill.table_id?.name}</p>
            </div>

            {/* Items */}
            <div className="border rounded-lg p-4 space-y-3">
              <h2 className="font-semibold text-lg">Items</h2>

              {bill.orders.map((order: any, idx: number) => (
                <div key={idx} className="border p-3 rounded-md">
                  <h3 className="font-medium text-sm">
                    Order #{String(order.order_id).slice(-4)}
                  </h3>

                  <div className="mt-2 space-y-1 text-sm">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span>
                          {item.name} ({item.size}) × {item.qty}
                        </span>
                        <span>₹{item.totalPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t pt-4 text-lg space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{bill.subtotal}</span>
              </div>

              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>₹{bill.gst}</span>
              </div>

              <div className="flex justify-between">
                <span>Discount</span>
                <span>₹{bill.discount}</span>
              </div>

              <div className="flex justify-between font-bold text-primary text-xl">
                <span>Total</span>
                <span>₹{bill.finalAmount}</span>
              </div>
            </div>

            {/* <Button
              className="w-full mt-4"
              onClick={() => openPrintWindow(bill)}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Bill
            </Button> */}

          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
