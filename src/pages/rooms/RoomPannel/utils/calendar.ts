import { format, addDays, startOfDay, differenceInDays, isToday, isWeekend, isSameDay, parseISO } from "date-fns";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface CalendarDay {
  date: Date;
  dateStr: string;
  dayOfWeek: string;
  dayNumber: number;
  monthShort: string;
  isToday: boolean;
  isWeekend: boolean;
}

/**
 * Generate array of calendar days for display
 */
export function generateCalendarDays(startDate: Date, numberOfDays: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  
  for (let i = 0; i < numberOfDays; i++) {
    const date = addDays(startOfDay(startDate), i);
    days.push({
      date,
      dateStr: format(date, "yyyy-MM-dd"),
      dayOfWeek: format(date, "EEE"),
      dayNumber: parseInt(format(date, "d")),
      monthShort: format(date, "MMM"),
      isToday: isToday(date),
      isWeekend: isWeekend(date),
    });
  }
  
  return days;
}

/**
 * Calculate booking block position and width
 */
export function calculateBookingPosition(
  checkIn: Date | string,
  checkOut: Date | string,
  calendarStart: Date,
  cellWidth: number
): { left: number; width: number; startOffset: number; endOffset: number } {
  const bookingStart = typeof checkIn === "string" ? parseISO(checkIn) : checkIn;
  const bookingEnd = typeof checkOut === "string" ? parseISO(checkOut) : checkOut;
  const calStart = startOfDay(calendarStart);
  
  // Calculate days from calendar start
  const startOffset = differenceInDays(startOfDay(bookingStart), calStart);
  const duration = differenceInDays(startOfDay(bookingEnd), startOfDay(bookingStart));
  
  return {
    left: startOffset * cellWidth,
    width: duration * cellWidth,
    startOffset,
    endOffset: startOffset + duration,
  };
}

/**
 * Check if a date falls within a booking period
 */
export function isDateInBooking(
  date: Date,
  checkIn: Date | string,
  checkOut: Date | string
): boolean {
  const targetDate = startOfDay(date);
  const bookingStart = startOfDay(typeof checkIn === "string" ? parseISO(checkIn) : checkIn);
  const bookingEnd = startOfDay(typeof checkOut === "string" ? parseISO(checkOut) : checkOut);
  
  return targetDate >= bookingStart && targetDate < bookingEnd;
}

/**
 * Format date range for display
 */
export function formatDateRange(start: Date, end: Date): string {
  if (isSameDay(start, end)) {
    return format(start, "MMM d, yyyy");
  }
  
  const sameMonth = format(start, "MMM") === format(end, "MMM");
  const sameYear = format(start, "yyyy") === format(end, "yyyy");
  
  if (sameMonth && sameYear) {
    return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
  }
  
  if (sameYear) {
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  }
  
  return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
}

/**
 * Get navigation date ranges
 */
export function getNavigationRanges(currentStart: Date, daysToShow: number) {
  return {
    previous: addDays(currentStart, -daysToShow),
    next: addDays(currentStart, daysToShow),
    today: startOfDay(new Date()),
  };
}

/**
 * Format relative date label
 */
export function getRelativeDateLabel(date: Date): string {
  const today = startOfDay(new Date());
  const targetDate = startOfDay(date);
  const diff = differenceInDays(targetDate, today);
  
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  
  return format(date, "MMM d");
}

/**
 * Calculate nights between dates
 */
export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const start = typeof checkIn === "string" ? parseISO(checkIn) : checkIn;
  const end = typeof checkOut === "string" ? parseISO(checkOut) : checkOut;
  return differenceInDays(startOfDay(end), startOfDay(start));
}
