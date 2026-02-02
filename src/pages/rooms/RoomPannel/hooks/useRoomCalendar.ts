import { useState, useEffect, useMemo, useCallback } from "react";
import { addDays, startOfDay, format } from "date-fns";
import { getAllRoomsApi, Room } from "@/api/roomApi";
import { getBookingByDateRangeApi, Booking, BookingSource } from "@/api/bookingApi";
import { generateCalendarDays, CalendarDay } from "../utils/calendar";

import { toast } from "sonner";

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE" | "BLOCKED";

export interface CalendarFilters {
  search: string;
  status: RoomStatus | "all";
  source: BookingSource | "all";
  roomType: string;
  floor: string;
}

export interface RoomWithBookings extends Room {
  bookings: Booking[];
}

export interface UseRoomCalendarReturn {
  // Data
  rooms: RoomWithBookings[];
  calendarDays: CalendarDay[];
  bookings: Booking[];
  
  // State
  loading: boolean;
  startDate: Date;
  daysToShow: number;
  filters: CalendarFilters;
  selectedBooking: Booking | null;
  selectedCell: { roomId: string; date: string } | null;
  
  // Actions
  setStartDate: (date: Date) => void;
  setFilters: (filters: Partial<CalendarFilters>) => void;
  navigateToday: () => void;
  navigatePrevious: () => void;
  navigateNext: () => void;
  selectBooking: (booking: Booking | null) => void;
  selectCell: (roomId: string, date: string) => void;
  clearSelection: () => void;
  refreshData: () => Promise<void>;
  
  // Derived data
  roomTypes: string[];
  floors: string[];
  filteredRooms: RoomWithBookings[];
}

const DEFAULT_DAYS_TO_SHOW = 14;

export function useRoomCalendar(): UseRoomCalendarReturn {
  // Core state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => startOfDay(new Date()));
  const [daysToShow] = useState(DEFAULT_DAYS_TO_SHOW);
  
  // Filter state
  const [filters, setFiltersState] = useState<CalendarFilters>({
    search: "",
    status: "all",
    source: "all",
    roomType: "",
    floor: "",
  });
  
  // Selection state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ roomId: string; date: string } | null>(null);

  // Generate calendar days
  const calendarDays = useMemo(
    () => generateCalendarDays(startDate, daysToShow),
    [startDate, daysToShow]
  );

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const endDate = addDays(startDate, daysToShow);
      const fromStr = format(startDate, "yyyy-MM-dd");
      const toStr = format(endDate, "yyyy-MM-dd");
      
      const [roomsResponse, bookingsResponse] = await Promise.all([
        getAllRoomsApi(),
        getBookingByDateRangeApi(fromStr, toStr),
      ]);
      
      setRooms(roomsResponse.rooms || []);
      setBookings(bookingsResponse || []);
    } catch (error) {
      toast.error("Failed to load calendar data");
      console.error("Calendar data fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, daysToShow]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Combine rooms with their bookings
  const roomsWithBookings = useMemo((): RoomWithBookings[] => {
    return rooms.map(room => ({
      ...room,
      bookings: bookings.filter(b => b.roomId === room._id),
    }));
  }, [rooms, bookings]);

  // Extract unique room types and floors
  const roomTypes = useMemo(
    () => [...new Set(rooms.map(r => r.type))].filter(Boolean),
    [rooms]
  );

  const floors = useMemo(
    () => [...new Set(rooms.map(r => String(r.floor)))].filter(Boolean).sort(),
    [rooms]
  );

  // Apply filters
  const filteredRooms = useMemo((): RoomWithBookings[] => {
    return roomsWithBookings.filter(room => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesNumber = room.number?.toLowerCase().includes(searchLower);
        const matchesType = room.type?.toLowerCase().includes(searchLower);
        if (!matchesNumber && !matchesType) return false;
      }
      
      // Status filter
      if (filters.status !== "all" && room.status !== filters.status) {
        return false;
      }
      
      // Room type filter
      if (filters.roomType && room.type !== filters.roomType) {
        return false;
      }
      
      // Floor filter
      if (filters.floor && String(room.floor) !== filters.floor) {
        return false;
      }
      
      // Source filter - check if room has any bookings with this source
      if (filters.source !== "all") {
        const hasMatchingSource = room.bookings.some(b => b.source === filters.source);
        if (!hasMatchingSource && room.bookings.length > 0) return false;
      }
      
      return true;
    });
  }, [roomsWithBookings, filters]);

  // Actions
  const setFilters = useCallback((newFilters: Partial<CalendarFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const navigateToday = useCallback(() => {
    setStartDate(startOfDay(new Date()));
  }, []);

  const navigatePrevious = useCallback(() => {
    setStartDate(prev => addDays(prev, -daysToShow));
  }, [daysToShow]);

  const navigateNext = useCallback(() => {
    setStartDate(prev => addDays(prev, daysToShow));
  }, [daysToShow]);

  const selectBooking = useCallback((booking: Booking | null) => {
    setSelectedBooking(booking);
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

  return {
    rooms: roomsWithBookings,
    calendarDays,
    bookings,
    loading,
    startDate,
    daysToShow,
    filters,
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
    filteredRooms,
  };
}
