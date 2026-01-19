import { CalendarDays, Moon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface StayDurationBarProps {
  checkIn: string;
  checkOut: string;
  nights: number;
}

export function StayDurationBar({
  checkIn,
  checkOut,
  nights,
}: StayDurationBarProps) {
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return { date: "—", time: "—" };
    const date = new Date(dateStr);
    return {
      date: format(date, "EEE, dd MMM yyyy"),
      time: format(date, "hh:mm a"),
    };
  };

  const checkInFormatted = formatDateTime(checkIn);
  const checkOutFormatted = formatDateTime(checkOut);

  /* -------- Night Badge Color -------- */
  const badgeColor =
    nights <= 1
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : nights <= 3
      ? "bg-teal-100 text-teal-700 border-teal-200"
      : nights <= 7
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-indigo-100 text-indigo-700 border-indigo-200";

  return (
    /* Grey Sub-container */
   <div className="rounded-md bg-muted/70 border border-border/50 px-4 py-3">

      <div className="stay-bar flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Check-in */}
        <div className="stay-info">
          <div className="flex items-center gap-1.5 mb-1">
            <CalendarDays className="h-3.5 w-3.5 text-erp-success" />
            <span className="stay-label">Check-in</span>
          </div>
          <span className="stay-value">{checkInFormatted.date}</span>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {checkInFormatted.time}
            </span>
          </div>
        </div>

        {/* Nights Badge */}
        <div className="flex justify-center">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium",
              badgeColor
            )}
          >
            <Moon className="h-4 w-4" />
            {nights} {nights === 1 ? "Night" : "Nights"}
          </div>
        </div>

        {/* Check-out */}
        <div className="stay-info sm:text-right sm:items-end">
          <div className="flex items-center gap-1.5 mb-1 sm:justify-end">
            <span className="stay-label">Check-out</span>
            <CalendarDays className="h-3.5 w-3.5 text-destructive" />
          </div>
          <span className="stay-value">{checkOutFormatted.date}</span>
          <div className="flex items-center gap-1 mt-0.5 sm:justify-end">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {checkOutFormatted.time}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
