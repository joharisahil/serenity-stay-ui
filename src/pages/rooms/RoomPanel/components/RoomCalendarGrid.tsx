import { cn } from "@/lib/utils";
import { RoomRow } from "./RoomRow";
import type {
  RoomWithBookings,
  CalendarDay,
  Booking,
} from "../hooks/useRoomCalendar";

interface RoomCalendarGridProps {
  rooms: RoomWithBookings[];
  calendarDays: CalendarDay[];
  loading: boolean;
  onCellClick: (roomId: string, dateStr: string) => void;
  onBookingClick: (booking: Booking) => void;
  selectedBookingId?: string;
}

const CELL_WIDTH = 90;

export function RoomCalendarGrid({
  rooms,
  calendarDays,
  loading,
  onCellClick,
  onBookingClick,
  selectedBookingId,
}: RoomCalendarGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-card rounded-xl border">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-muted-foreground text-sm">
            Loading calendar...
          </span>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-card rounded-xl border">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No rooms found
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Try adjusting your filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border shadow-premium overflow-hidden">
      <div className="overflow-x-auto calendar-scroll">
        <div
          style={{
            minWidth: `${180 + calendarDays.length * CELL_WIDTH}px`,
          }}
        >
          {/* ================= HEADER ================= */}
          <div className="flex border-b-2 border-border bg-calendar-header sticky top-0 z-20">
            {/* Room Header */}
            <div
              className={cn(
                "sticky left-0 z-30 flex items-center px-4 py-3",
                "min-w-[180px] w-[180px] border-r bg-calendar-header",
                "shadow-[2px_0_8px_-2px_rgba(0,0,0,0.08)]"
              )}
            >
              <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Rooms
              </span>
            </div>

            {/* Date Headers */}
            <div className="flex">
              {calendarDays.map((day) => (
                <div
                  key={day.dateStr}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 border-r border-border/30",
                    day.isToday && "bg-calendar-today",
                    day.isWeekend && !day.isToday && "bg-calendar-weekend"
                  )}
                  style={{
                    width: `${CELL_WIDTH}px`,
                    minWidth: `${CELL_WIDTH}px`,
                  }}
                >
                  <span
                    className={cn(
                      "text-xs font-medium uppercase",
                      day.isToday
                        ? "text-accent"
                        : "text-muted-foreground",
                      day.isWeekend && "text-muted-foreground/70"
                    )}
                  >
                    {day.dayOfWeek}
                  </span>

                  <span
                    className={cn(
                      "text-lg font-bold",
                      day.isToday && "text-accent"
                    )}
                  >
                    {day.dayNumber}
                  </span>

                  {day.dayNumber === 1 && (
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {day.monthShort}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ================= ROWS ================= */}
          <div>
            {rooms.map((room) => (
              <RoomRow
                key={room._id}
                room={room}
                calendarDays={calendarDays}
                cellWidth={CELL_WIDTH}
                onCellClick={onCellClick}
                onBookingClick={onBookingClick}
                selectedBookingId={selectedBookingId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
