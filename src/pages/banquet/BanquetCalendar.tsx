import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { getBanquetBookingsForCalendarApi } from "@/api/banquetCalendarApi";
import { BanquetCalendarBooking } from "@/types/banquet";


/* ================= TYPES ================= */

type Booking = {
  _id: string;
  eventType: string;
  customerName: string;
  hall: {
    _id: string;
    name: string;
  };
  eventDate: string;
  startTime: string;
  endTime: string;
  bookingStatus: "ENQUIRY" | "TENTATIVE" | "CONFIRMED" | "CANCELLED";
  totals: {
    paidAmount: number;
    balanceAmount: number;
    grandTotal: number;
  };
};

/* ================= HELPERS ================= */

const getPaymentStatus = (b: Booking) => {
  if (b.totals.paidAmount === 0) return "DUE";
  if (b.totals.balanceAmount > 0) return "PARTIAL";
  return "PAID";
};

const bookingStatusColor: Record<string, string> = {
  CONFIRMED: "bg-blue-600",
  TENTATIVE: "bg-orange-500",
  ENQUIRY: "bg-gray-500",
  CANCELLED: "bg-gray-400",
};

const paymentStatusColor: Record<string, string> = {
  PAID: "bg-green-600",
  PARTIAL: "bg-yellow-500",
  DUE: "bg-red-600",
};

/* ================= COMPONENT ================= */

export default function BanquetCalendar() {
  const navigate = useNavigate();

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [hallFilter, setHallFilter] = useState<string>("ALL");
const [bookings, setBookings] = useState<BanquetCalendarBooking[]>([]);

  const [hallOptions, setHallOptions] = useState<string[]>(["ALL"]);

  /* ================= LOAD BOOKINGS ================= */

  useEffect(() => {
    const loadBookings = async () => {
      const from = currentMonth.startOf("month").format("YYYY-MM-DD");
      const to = currentMonth.endOf("month").format("YYYY-MM-DD");

      const data = await getBanquetBookingsForCalendarApi({
        from,
        to,
        hallId: hallFilter !== "ALL" ? hallFilter : undefined,
      });

      setBookings(data);

      // extract unique halls
      const halls = Array.from(
        new Set(data.map((b: Booking) => b.hall.name))
      );

      setHallOptions(["ALL", ...halls]);
    };

    loadBookings().catch(() => {});
  }, [currentMonth, hallFilter]);

  /* ================= CALENDAR GRID ================= */

  const daysInMonth = Array.from(
    { length: currentMonth.daysInMonth() },
    (_, i) => currentMonth.date(i + 1)
  );

  return (
    <Layout>
      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Banquet Calendar</h1>
          <p className="text-muted-foreground">
            Month-wise hall booking & payment overview
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Hall Filter */}
          <Select value={hallFilter} onValueChange={setHallFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select Hall" />
            </SelectTrigger>
            <SelectContent>
              {hallOptions.map(h => (
                <SelectItem key={h} value={h}>
                  {h === "ALL" ? "All Halls" : h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => navigate("/banquet/halls")}>
            Manage Halls
          </Button>

          <Button variant="outline" onClick={() => navigate("/banquet/plans")}>
            Manage Plans
          </Button>

          <Button onClick={() => navigate("/banquet/create")}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>

      {/* ================= MONTH CONTROLS ================= */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentMonth(m => m.subtract(1, "month"))}
        >
          <ChevronLeft />
        </Button>

        <h2 className="text-xl font-semibold">
          {currentMonth.format("MMMM YYYY")}
        </h2>

        <Button
          variant="outline"
          onClick={() => setCurrentMonth(m => m.add(1, "month"))}
        >
          <ChevronRight />
        </Button>
      </div>

      {/* ================= LEGEND ================= */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <Badge className="bg-blue-600">Confirmed</Badge>
        <Badge className="bg-orange-500">Tentative</Badge>
        <Badge className="bg-gray-500">Enquiry</Badge>

        <Badge className="bg-green-600">Paid</Badge>
        <Badge className="bg-yellow-500">Partial</Badge>
        <Badge className="bg-red-600">Due</Badge>
      </div>

      {/* ================= CALENDAR ================= */}
      <div className="mt-6 grid grid-cols-7 gap-2">
        {daysInMonth.map(day => {
          const dayBookings = bookings.filter(
            b =>
              dayjs(b.eventDate).format("YYYY-MM-DD") ===
              day.format("YYYY-MM-DD")
          );

          return (
            <div
              key={day.toString()}
              className="rounded-lg border p-2 min-h-[140px]"
            >
              <div className="mb-1 text-sm font-semibold">
                {day.format("DD")}
              </div>

              <div className="space-y-2">
                {dayBookings.map(b => {
                  const paymentStatus = getPaymentStatus(b);

                  return (
                    <div
                      key={b._id}
                      onClick={() => navigate(`/banquet/${b._id}`)}
                      className="cursor-pointer rounded-md p-2 text-xs text-white bg-slate-800 hover:opacity-90"
                    >
                      <Badge
                        className={`mb-1 ${bookingStatusColor[b.bookingStatus]}`}
                      >
                        {b.bookingStatus}
                      </Badge>

                      <div className="font-semibold">{b.eventType}</div>
                      <div>
                        {b.startTime} - {b.endTime}
                      </div>
                      <div className="text-[10px] opacity-80">
                        {b.hall.name}
                      </div>

                      <Badge
                        className={`mt-1 ${paymentStatusColor[paymentStatus]}`}
                      >
                        {paymentStatus}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
