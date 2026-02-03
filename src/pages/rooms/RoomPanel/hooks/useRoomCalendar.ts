import { useState, useEffect, useMemo, useCallback } from "react";
import { addDays, startOfDay, format } from "date-fns";
import { toast } from "sonner";

import { getAllRoomsApi, getRoomCalendarApi } from "@/api/roomApi";

/* =====================================================
   TYPES – SINGLE SOURCE OF TRUTH FOR CALENDAR
===================================================== */

/* -------- Room -------- */
export interface Room {
  _id: string;
  number: string;
  type: string;
  floor?: number;
  status?: string;
}

/* -------- Calendar Day -------- */
export interface CalendarDay {
  date: Date;
  dateStr: string;
  dayOfWeek: string;
  dayNumber: number;
  monthShort: string;
  isToday: boolean;
  isWeekend: boolean;
}

/* -------- Booking -------- */
export type BookingStatus =
  | "OCCUPIED"
  | "CONFIRMED"
  | "BLOCKED"
  | "MAINTENANCE";

export type BookingSource =
  | "WALK_IN"
  | "OTA"
  | "BANQUET"
  | "CORPORATE";

export interface Booking {
  _id: string;
  room_id: {
    _id: string;
    number: string;
    type: string;
    floor?: number;
  };
  guestName?: string;
  companyName?: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  source?: BookingSource;
}

/* -------- Filters -------- */
export interface CalendarFilters {
  search: string;
  status: BookingStatus | "all";
  source: BookingSource | "all";
  roomType: string;
  floor: string;
}

/* -------- Room + Bookings -------- */
export interface RoomWithBookings extends Room {
  bookings: Booking[];
}

/* -------- Hook Return -------- */
export interface UseRoomCalendarReturn {
  rooms: RoomWithBookings[];
  calendarDays: CalendarDay[];
  loading: boolean;

  startDate: Date;
  daysToShow: number;

  filters: CalendarFilters;
  filteredRooms: RoomWithBookings[];

  selectedBooking: Booking | null;
  selectedCell: { roomId: string; date: string } | null;

  setStartDate: (date: Date) => void;
  setFilters: (filters: Partial<CalendarFilters>) => void;

  navigateToday: () => void;
  navigatePrevious: () => void;
  navigateNext: () => void;

  selectBooking: (booking: Booking | null) => void;
  selectCell: (roomId: string, date: string) => void;
  clearSelection: () => void;

  refreshData: () => Promise<void>;

  roomTypes: string[];
  floors: string[];
}

/* =====================================================
   CONSTANTS
===================================================== */

const DEFAULT_DAYS_TO_SHOW = 14;

/* =====================================================
   HELPERS
===================================================== */

function generateCalendarDays(start: Date, days: number): CalendarDay[] {
  const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");
  const result: CalendarDay[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    const dateStr = format(date, "yyyy-MM-dd");

    result.push({
      date,
      dateStr,
      dayOfWeek: format(date, "EEE").toUpperCase(),
      dayNumber: date.getDate(),
      monthShort: format(date, "MMM").toUpperCase(),
      isToday: dateStr === todayStr,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    });
  }

  return result;
}

/* =====================================================
   HOOK
===================================================== */

export function useRoomCalendar(): UseRoomCalendarReturn {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState(() =>
    startOfDay(new Date())
  );
  const [daysToShow] = useState(DEFAULT_DAYS_TO_SHOW);

  const [filters, setFiltersState] = useState<CalendarFilters>({
    search: "",
    status: "all",
    source: "all",
    roomType: "",
    floor: "",
  });

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  const [selectedCell, setSelectedCell] =
    useState<{ roomId: string; date: string } | null>(null);

  /* ---------------- Calendar Days ---------------- */

  const calendarDays = useMemo(
    () => generateCalendarDays(startDate, daysToShow),
    [startDate, daysToShow]
  );

  /* ---------------- Fetch Data ---------------- */

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const from = format(startDate, "yyyy-MM-dd");
      const to = format(addDays(startDate, daysToShow), "yyyy-MM-dd");

      const [roomsRes, calendarRes] = await Promise.all([
        getAllRoomsApi(),                // returns Room[]
        getRoomCalendarApi(from, to),    // returns { bookings }
      ]);

      setRooms(roomsRes || []);
      setBookings(calendarRes.bookings || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load room calendar data");
    } finally {
      setLoading(false);
    }
  }, [startDate, daysToShow]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------- Merge Rooms + Bookings ---------------- */

  const roomsWithBookings = useMemo<RoomWithBookings[]>(() => {
    return rooms.map(room => ({
      ...room,
      bookings: bookings.filter(
        b => b.room_id?._id === room._id
      ),
    }));
  }, [rooms, bookings]);

  /* ---------------- Filters Meta ---------------- */

  const roomTypes = useMemo(
    () => [...new Set(rooms.map(r => r.type))].filter(Boolean),
    [rooms]
  );

  const floors = useMemo(
    () =>
      [...new Set(rooms.map(r => r.floor))]
        .filter(f => f !== undefined)
        .map(String)
        .sort(),
    [rooms]
  );

  /* ---------------- Apply Filters ---------------- */

  const filteredRooms = useMemo<RoomWithBookings[]>(() => {
    return roomsWithBookings.filter(room => {
      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (
          !room.number.toLowerCase().includes(s) &&
          !room.type.toLowerCase().includes(s)
        ) {
          return false;
        }
      }

      if (filters.roomType && room.type !== filters.roomType) {
        return false;
      }

      if (filters.floor && String(room.floor) !== filters.floor) {
        return false;
      }

      if (filters.status !== "all") {
        if (!room.bookings.some(b => b.status === filters.status)) {
          return false;
        }
      }

      if (filters.source !== "all") {
        if (
          room.bookings.length > 0 &&
          !room.bookings.some(
            b => (b.source || "DIRECT") === filters.source
          )
        ) {
          return false;
        }
      }

      return true;
    });
  }, [roomsWithBookings, filters]);

  /* ---------------- Actions ---------------- */

  const setFilters = useCallback(
    (next: Partial<CalendarFilters>) => {
      setFiltersState(prev => ({ ...prev, ...next }));
    },
    []
  );

  const navigateToday = useCallback(() => {
    setStartDate(startOfDay(new Date()));
  }, []);

  const navigatePrevious = useCallback(() => {
    setStartDate(prev => addDays(prev, -daysToShow));
  }, [daysToShow]);

  const navigateNext = useCallback(() => {
    setStartDate(prev => addDays(prev, daysToShow));
  }, [daysToShow]);

  const selectBooking = useCallback((b: Booking | null) => {
    setSelectedBooking(b);
    setSelectedCell(null);
  }, []);

  const selectCell = useCallback((roomId: string, date: string) => {
    setSelectedCell({ roomId, date });
    setSelectedBooking(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedBooking(null);
    setSelectedCell(null);
  }, []);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  /* ---------------- Return ---------------- */

  return {
    rooms: roomsWithBookings,
    calendarDays,
    loading,

    startDate,
    daysToShow,

    filters,
    filteredRooms,

    selectedBooking,
    selectedCell,

    setStartDate,
    setFilters,

    navigateToday,
    navigatePrevious,
    navigateNext,

    selectBooking,
    selectCell,
    clearSelection,

    refreshData,

    roomTypes,
    floors,
  };
}
