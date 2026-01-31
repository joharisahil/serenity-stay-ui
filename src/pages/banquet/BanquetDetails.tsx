import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Edit } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const bookingData = {
  "1": {
    customer: "Sharma Family",
    mobile: "+91 98765 43210",
    email: "sharma@example.com",
    event: "Wedding Reception",
    hall: "Grand Hall",
    capacity: 500,
    date: "2025-11-20",
    time: "18:00",
    guests: 500,
    packageType: "luxury",
    pricePerPerson: 1200,
    advance: 100000,
    status: "confirmed",
    decorations: "Traditional Indian Wedding Theme",
    menu: ["Starters", "Main Course (North & South Indian)", "Desserts", "Live Counter"],
  },
};

export default function BanquetDetails() {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const booking = bookingData[bookingId as keyof typeof bookingData];

  if (!booking) {
    return (
      <Layout>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Booking not found</h1>
          <Button className="mt-4" onClick={() => navigate("/banquet")}>
            Back to Banquet
          </Button>
        </div>
      </Layout>
    );
  }

  const subtotal = booking.pricePerPerson * booking.guests;
  const tax = subtotal * 0.18;
  const total = subtotal + tax;
  const balance = total - booking.advance;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/banquet")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Banquet Booking Details</h1>
              <p className="text-muted-foreground">{booking.event}</p>
            </div>
          </div>
          <Badge className="bg-success text-white">Confirmed</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{booking.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{booking.mobile}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{booking.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Event Type</p>
                  <p className="font-medium">{booking.event}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(booking.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{booking.time}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected Guests</p>
                <p className="font-medium">{booking.guests}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Hall & Package Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Hall Selected</p>
                  <p className="font-medium">{booking.hall} (Capacity: {booking.capacity})</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Package</p>
                  <p className="font-medium capitalize">{booking.packageType} - ₹{booking.pricePerPerson}/person</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Decorations</p>
                  <p className="font-medium">{booking.decorations}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Menu</p>
                  <ul className="mt-1 list-inside list-disc font-medium">
                    {booking.menu.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({booking.guests} guests)</span>
                  <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span className="font-medium">₹{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-3 text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary">₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Advance Paid</span>
                  <span className="font-medium">₹{booking.advance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-3 text-lg font-bold">
                  <span>Balance Due</span>
                  <span className="text-warning">₹{balance.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Booking
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Contract
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button>
        </div>
      </div>
    </Layout>
  );
}
