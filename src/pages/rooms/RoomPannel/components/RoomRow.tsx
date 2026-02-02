import { cn } from "@/lib/utils";
import { BookingBlock } from "./BookingBlock";
import type { RoomWithBookings } from "@/hooks/useRoomCalendar";
import type { CalendarDay } from "@/utils/calendar";
import type { Booking } from "@/api/bookingApi";

interface RoomRowProps {
  room: RoomWithBookings;
  calendarDays: CalendarDay[];
  cellWidth: number;
  onCellClick: (roomId: string, dateStr: string) => void;
  onBookingClick: (booking: Booking) => void;
  selectedBookingId?: string;
}

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
}: RoomRowProps) {
  return (
    <div className="flex border-b border-border/50 hover:bg-muted/30 transition-colors">
      {/* Sticky Room Info Column */}
      <div
        className={cn(
          "sticky left-0 z-10 flex items-center gap-3 px-4 py-3",
          "min-w-[180px] w-[180px] border-r bg-card",
          "shadow-[2px_0_8px_-2px_rgba(0,0,0,0.08)]"
        )}
      >
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm",
            statusBgClass[room.status]
          )}
        >
          {room.number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{room.type}</span>
            <div className={cn("h-2 w-2 rounded-full shrink-0", statusDotClass[room.status])} />
          </div>
          <div className="text-xs text-muted-foreground">
            Floor {room.floor} • {room.maxGuests} guests
          </div>
        </div>
      </div>

      {/* Calendar Cells */}
      <div className="flex-1 relative">
        <div className="flex">
          {calendarDays.map((day) => (
            <div
              key={day.dateStr}
              onClick={() => onCellClick(room._id, day.dateStr)}
              className={cn(
                "h-14 border-r border-border/30 cursor-pointer transition-colors",
                "hover:bg-calendar-cell-hover",
                day.isToday && "bg-calendar-today",
                day.isWeekend && !day.isToday && "bg-calendar-weekend"
              )}
              style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}
            />
          ))}
        </div>

        {/* Booking Blocks Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative h-full pointer-events-auto">
            {room.bookings.map((booking) => (
              <BookingBlock
                key={booking._id}
                booking={booking}
                calendarStart={calendarDays[0]?.date}
                cellWidth={cellWidth}
                onClick={onBookingClick}
                isSelected={selectedBookingId === booking._id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
