import { cn } from "@/lib/utils";
import { BookingBlock } from "./BookingBlock";
import type {
  RoomWithBookings,
  CalendarDay,
  Booking,
} from "../hooks/useRoomCalendar";

interface RoomRowProps {
  room: RoomWithBookings;
  calendarDays: CalendarDay[];
  cellWidth: number;
  onCellClick: (roomId: string, dateStr: string) => void;
  onBookingClick: (booking: Booking) => void;
  selectedBookingId?: string;

  hideCalendarCells?: boolean;
  onlyCalendarCells?: boolean;
}

/* ================= STATUS STYLES ================= */

const statusBgClass: Record<string, string> = {
  AVAILABLE: "bg-room-available/10",
  OCCUPIED: "bg-room-occupied/10",
  CLEANING: "bg-room-cleaning/10",
  MAINTENANCE: "bg-room-maintenance/10",
  BLOCKED: "bg-room-blocked/10",
};

const statusDotClass: Record<string, string> = {
  AVAILABLE: "bg-room-available",
  OCCUPIED: "bg-room-occupied",
  CLEANING: "bg-room-cleaning",
  MAINTENANCE: "bg-room-maintenance",
  BLOCKED: "bg-room-blocked",
};

export function RoomRow({
  room,
  calendarDays,
  cellWidth,
  onCellClick,
  onBookingClick,
  selectedBookingId,
  hideCalendarCells,
  onlyCalendarCells,
}: RoomRowProps) {
  const roomStatus = room.status || "AVAILABLE";
  const rowWidth = calendarDays.length * cellWidth;

  return (
    <div className="flex h-14 border-b border-border/50 hover:bg-muted/30 transition-colors">
      {/* ================= LEFT: ROOM INFO ================= */}
      {!onlyCalendarCells && (
        <div className="w-[180px] min-w-[180px] h-14 px-4 flex items-center gap-3 bg-card">
          <div
            className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm",
              statusBgClass[roomStatus],
            )}
          >
            {room.number}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{room.type}</span>
              <div
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  statusDotClass[roomStatus],
                )}
              />
            </div>

            <div className="text-xs text-muted-foreground">
              Floor {room.floor ?? "-"}
            </div>
          </div>
        </div>
      )}

      {/* ================= RIGHT: CALENDAR CELLS ================= */}
      {!hideCalendarCells && (
        <div
          className="relative h-14"
          style={{
            width: `${rowWidth}px`,
            minWidth: `${rowWidth}px`,
          }}
        >
          {/* Empty grid cells */}
          <div className="flex">
            {calendarDays.map((day) => (
              <div
                key={day.dateStr}
                onClick={() => onCellClick(room._id, day.dateStr)}
                className={cn(
                  "h-14 border-r border-border/30 cursor-pointer transition-colors",
                  "hover:bg-calendar-cell-hover",
                  day.isToday && "bg-calendar-today",
                  day.isWeekend && !day.isToday && "bg-calendar-weekend",
                )}
                style={{
                  width: `${cellWidth}px`,
                  minWidth: `${cellWidth}px`,
                }}
              />
            ))}
          </div>

          {/* ================= BOOKING BLOCKS OVERLAY ================= */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="relative h-full pointer-events-auto">
              {room.bookings.map((booking) => (
                <BookingBlock
                  key={booking._id}
                  booking={booking}
                  calendarStart={calendarDays[0].date}
                  cellWidth={cellWidth}
                  totalDays={calendarDays.length}
                  onClick={onBookingClick}
                  isSelected={selectedBookingId === booking._id}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
