import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Edit, CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

// Demo data
const bookingData = {
  "102": {
    guest: "Rajesh Kumar",
    mobile: "+91 98765 43210",
    email: "rajesh@example.com",
    room: "102",
    type: "Deluxe",
    floor: 1,
    checkIn: "2025-11-15",
    checkOut: "2025-11-18",
    guests: 2,
    status: "occupied",
    paymentMode: "UPI",
    advance: 5000,
    pricePerNight: 3500,
    nights: 3,
    services: [
      { name: "Breakfast", price: 500 },
      { name: "Laundry", price: 300 },
    ],
  },
};

export default function BookingDetails() {
  const navigate = useNavigate();
  const { roomNumber } = useParams();
  const booking = bookingData[roomNumber as keyof typeof bookingData];

  if (!booking) {
    return (
      <Layout>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Booking not found</h1>
          <Button className="mt-4" onClick={() => navigate("/rooms")}>
            Back to Rooms
          </Button>
        </div>
      </Layout>
    );
  }

  const roomTotal = booking.pricePerNight * booking.nights;
  const servicesTotal = booking.services.reduce((sum, s) => sum + s.price, 0);
  const subtotal = roomTotal + servicesTotal;
  const tax = subtotal * 0.18;
  const total = subtotal + tax;
  const balance = total - booking.advance;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/rooms")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Booking Details</h1>
              <p className="text-muted-foreground">Room {booking.room} - {booking.type}</p>
            </div>
          </div>
          <Badge className="bg-room-occupied text-white">Occupied</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{booking.guest}</p>
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
                  <p className="text-sm text-muted-foreground">Number of Guests</p>
                  <p className="font-medium">{booking.guests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stay Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Check-in</p>
                <p className="font-medium">{new Date(booking.checkIn).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-out</p>
                <p className="font-medium">{new Date(booking.checkOut).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Nights</p>
                <p className="font-medium">{booking.nights} nights</p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Billing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room ({booking.nights} nights × ₹{booking.pricePerNight})</span>
                    <span className="font-medium">₹{roomTotal.toLocaleString()}</span>
                  </div>
                  {booking.services.map((service, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-muted-foreground">{service.name}</span>
                      <span className="font-medium">₹{service.price.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span className="font-medium">₹{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-lg font-bold">
                    <span>Total Amount</span>
                    <span className="text-primary">₹{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span>Advance Paid ({booking.paymentMode})</span>
                    <span className="font-medium">₹{booking.advance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-lg font-bold">
                    <span>Balance Due</span>
                    <span className="text-warning">₹{balance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark Check-out
          </Button>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Change Room
          </Button>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Extend Stay
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Receipt
          </Button>
        </div>
      </div>
    </Layout>
  );
}
