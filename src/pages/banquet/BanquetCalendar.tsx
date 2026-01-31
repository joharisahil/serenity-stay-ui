import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const bookings = [
  { id: 1, customer: "Sharma Family", event: "Wedding Reception", hall: "Grand Hall", date: "2025-11-20", guests: 500, status: "confirmed" },
  { id: 2, customer: "Tech Corp", event: "Conference", hall: "Pearl Hall", date: "2025-11-22", guests: 150, status: "confirmed" },
  { id: 3, customer: "Kumar Family", event: "Birthday Party", hall: "Diamond Hall", date: "2025-11-25", guests: 100, status: "pending" },
  { id: 4, customer: "ABC Company", event: "Product Launch", hall: "Grand Hall", date: "2025-11-28", guests: 300, status: "confirmed" },
];

const statusColors = {
  confirmed: "bg-success text-white",
  pending: "bg-warning text-white",
  cancelled: "bg-destructive text-white",
};

export default function BanquetCalendar() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Banquet Bookings</h1>
            <p className="text-muted-foreground">Manage banquet hall reservations</p>
          </div>
          <Button onClick={() => navigate("/banquet/create")}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>

        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate(`/banquet/${booking.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <CalendarIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold">{booking.event}</h3>
                      <p className="text-sm text-muted-foreground">{booking.customer}</p>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="text-muted-foreground">{booking.hall}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{booking.guests} guests</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-medium">{new Date(booking.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
