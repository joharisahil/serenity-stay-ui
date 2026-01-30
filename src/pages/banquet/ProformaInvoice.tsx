import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProformaInvoice() {
  const navigate = useNavigate();

  const data = {
    customer: "Sharma Family",
    event: "Wedding Reception",
    hall: "Grand Hall",
    date: "20 Nov 2025",
    guests: 500,
    foodAmount: 600000,
    services: 20000,
    total: 620000,
    advancePaid: 100000,
    balance: 520000,
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Proforma Invoice
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              This is not a tax invoice
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <p><b>Customer:</b> {data.customer}</p>
            <p><b>Event:</b> {data.event}</p>
            <p><b>Hall:</b> {data.hall}</p>
            <p><b>Date:</b> {data.date}</p>

            <hr />

            <div className="flex justify-between">
              <span>Food Charges</span>
              <span>₹{data.foodAmount}</span>
            </div>
            <div className="flex justify-between">
              <span>Additional Services</span>
              <span>₹{data.services}</span>
            </div>

            <hr />

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{data.total}</span>
            </div>

            <div className="flex justify-between text-green-600">
              <span>Advance Paid</span>
              <span>₹{data.advancePaid}</span>
            </div>

            <div className="flex justify-between text-red-600 font-semibold">
              <span>Balance Due</span>
              <span>₹{data.balance}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
