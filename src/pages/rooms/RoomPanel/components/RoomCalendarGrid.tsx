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
    <div className="bg-card rounded-xl border shadow-premium">
      <div className="flex w-full">
        {/* ================= LEFT: ROOMS ================= */}
        <div className="w-[180px] min-w-[180px] border-r">
          {/* Header */}
          <div className="h-[64px] border-b bg-calendar-header flex items-center px-4">
            <span className="font-semibold text-sm text-muted-foreground uppercase">
              Rooms
            </span>
          </div>

          {/* Room rows (NO SCROLL HERE) */}
          {rooms.map((room) => (
            <RoomRow
              key={room._id}
              room={room}
              calendarDays={calendarDays}
              cellWidth={CELL_WIDTH}
              onCellClick={onCellClick}
              onBookingClick={onBookingClick}
              selectedBookingId={selectedBookingId}
              hideCalendarCells
            />
          ))}
        </div>

        {/* ================= RIGHT: CALENDAR ================= */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div style={{ minWidth: calendarDays.length * CELL_WIDTH }}>
            {/* Header */}
            <div className="flex h-[64px] border-b bg-calendar-header sticky top-0 z-10">
              {calendarDays.map((day) => (
                <div
                  key={day.dateStr}
                  className={cn(
                    "flex flex-col items-center justify-center border-r",
                    day.isToday && "bg-calendar-today",
                    day.isWeekend && !day.isToday && "bg-calendar-weekend",
                  )}
                  style={{ width: CELL_WIDTH }}
                >
                  <span className="text-xs uppercase">{day.dayOfWeek}</span>
                  <span className="text-lg font-bold">{day.dayNumber}</span>
                </div>
              ))}
            </div>

            {/* Calendar rows ( */}
            {rooms.map((room) => (
              <RoomRow
                key={room._id}
                room={room}
                calendarDays={calendarDays}
                cellWidth={CELL_WIDTH}
                onCellClick={onCellClick}
                onBookingClick={onBookingClick}
                selectedBookingId={selectedBookingId}
                onlyCalendarCells
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
