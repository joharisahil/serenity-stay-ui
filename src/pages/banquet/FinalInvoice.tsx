import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "lucide-react";

export default function FinalInvoice() {
  const gstRate = 18;

  const subtotal = 620000;
  const gst = (subtotal * gstRate) / 100;
  const total = subtotal + gst;

  return (
    <Layout>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Tax Invoice
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (18%)</span>
            <span>₹{gst}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total Payable</span>
            <span>₹{total}</span>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
