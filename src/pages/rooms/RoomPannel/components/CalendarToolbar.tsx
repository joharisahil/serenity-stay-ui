import { Search, ChevronLeft, ChevronRight, Calendar, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarFilters, RoomStatus } from "@/hooks/useRoomCalendar";
import type { BookingSource } from "@/api/bookingApi";

interface CalendarToolbarProps {
  startDate: Date;
  filters: CalendarFilters;
  roomTypes: string[];
  floors: string[];
  onFiltersChange: (filters: Partial<CalendarFilters>) => void;
  onNavigateToday: () => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onDateChange: (date: Date) => void;
  onNewBooking: () => void;
}

const statusOptions: { value: RoomStatus | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "AVAILABLE", label: "Available" },
  { value: "OCCUPIED", label: "Occupied" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "BLOCKED", label: "Blocked" },
];

const sourceOptions: { value: BookingSource | "all"; label: string }[] = [
  { value: "all", label: "All Sources" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "PHONE", label: "Phone" },
  { value: "OTA", label: "OTA" },
  { value: "BANQUET", label: "Banquet" },
];

export function CalendarToolbar({
  startDate,
  filters,
  roomTypes,
  floors,
  onFiltersChange,
  onNavigateToday,
  onNavigatePrevious,
  onNavigateNext,
  onDateChange,
  onNewBooking,
}: CalendarToolbarProps) {
  const activeFilterCount = [
    filters.status !== "all",
    filters.source !== "all",
    filters.roomType !== "",
    filters.floor !== "",
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Top Row: Title + Primary Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-premium">
            <Calendar className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Room Calendar</h1>
            <p className="text-sm text-muted-foreground">
              Manage bookings and room availability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Navigation */}
          <div className="flex items-center rounded-lg border bg-card shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={onNavigatePrevious}
              className="rounded-r-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="min-w-[140px] font-medium"
                >
                  {format(startDate, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <CalendarUI
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && onDateChange(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={onNavigateNext}
              className="rounded-l-none"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" onClick={onNavigateToday} className="font-medium">
            Today
          </Button>

          <Button onClick={onNewBooking} className="shadow-premium">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Second Row: Search + Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search room number or type..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-9 bg-card"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ status: value as RoomStatus | "all" })}
          >
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.source}
            onValueChange={(value) => onFiltersChange({ source: value as BookingSource | "all" })}
          >
            <SelectTrigger className="w-[130px] bg-card">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {roomTypes.length > 0 && (
            <Select
              value={filters.roomType || "all"}
              onValueChange={(value) => onFiltersChange({ roomType: value === "all" ? "" : value })}
            >
              <SelectTrigger className="w-[140px] bg-card">
                <SelectValue placeholder="Room Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {roomTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {floors.length > 0 && (
            <Select
              value={filters.floor || "all"}
              onValueChange={(value) => onFiltersChange({ floor: value === "all" ? "" : value })}
            >
              <SelectTrigger className="w-[120px] bg-card">
                <SelectValue placeholder="Floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                {floors.map((floor) => (
                  <SelectItem key={floor} value={floor}>
                    Floor {floor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onFiltersChange({
                  status: "all",
                  source: "all",
                  roomType: "",
                  floor: "",
                })
              }
              className="text-muted-foreground hover:text-foreground"
            >
              Clear filters
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            </Button>
          )}
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="text-muted-foreground font-medium">Status:</span>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-room-available" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-room-occupied" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-room-cleaning" />
          <span>Cleaning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-room-maintenance" />
          <span>Maintenance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-room-blocked" />
          <span>Blocked</span>
        </div>

        <span className="mx-2 text-border">|</span>

        <span className="text-muted-foreground font-medium">Source:</span>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-source-walkin" />
          <span>Walk-in</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-source-phone" />
          <span>Phone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-source-ota" />
          <span>OTA</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-source-banquet" />
          <span>Banquet</span>
        </div>
      </div>
    </div>
  );
}
