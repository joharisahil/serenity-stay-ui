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
    <div className="calendar-wrapper">
      
      {/* ================= LEFT: ROOMS ================= */}
      <div className="rooms-column">
        {/* Empty header spacer (aligns with date header height) */}
        <div className="h-[64px] border-b bg-calendar-header flex items-center px-4">
          <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Rooms
          </span>
        </div>

        {/* Room rows */}
        {rooms.map((room) => (
          <RoomRow
            key={room._id}
            room={room}
            calendarDays={calendarDays}
            cellWidth={CELL_WIDTH}
            onCellClick={onCellClick}
            onBookingClick={onBookingClick}
            selectedBookingId={selectedBookingId}
            hideCalendarCells   // 👈 IMPORTANT (explained below)
          />
        ))}
      </div>

      {/* ================= RIGHT: CALENDAR ================= */}
      <div className="calendar-scroll">
        <div
          className="calendar-grid"
          style={{
            minWidth: `${calendarDays.length * CELL_WIDTH}px`,
          }}
        >
          {/* ================= HEADER ================= */}
          <div className="calendar-header flex border-b-2 border-border bg-calendar-header sticky top-0 z-20">
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
                <span className="text-xs font-medium uppercase">
                  {day.dayOfWeek}
                </span>
                <span className="text-lg font-bold">
                  {day.dayNumber}
                </span>
              </div>
            ))}
          </div>

          {/* ================= CALENDAR ROWS ================= */}
          {rooms.map((room) => (
            <RoomRow
              key={room._id}
              room={room}
              calendarDays={calendarDays}
              cellWidth={CELL_WIDTH}
              onCellClick={onCellClick}
              onBookingClick={onBookingClick}
              selectedBookingId={selectedBookingId}
              onlyCalendarCells   // 👈 IMPORTANT
            />
          ))}
        </div>
      </div>

    </div>
  </div>
);

}
