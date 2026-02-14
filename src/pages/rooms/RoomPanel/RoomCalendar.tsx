import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

import { Layout } from "@/components/layout/Layout";
import { CalendarToolbar } from "./components/CalendarToolbar";
import { RoomCalendarGrid } from "./components/RoomCalendarGrid";
import { BookingSidePanel } from "./components/BookingSidePanel";
import { CellActionsPanel } from "./components/CellActionsPanel";
import { BlockRoomsModal } from "./components/BlockRoomsModal";
import { useRoomCalendar } from "./hooks/useRoomCalendar";
import type { Booking } from "./hooks/useRoomCalendar";

export default function RoomCalendar() {
  const navigate = useNavigate();

  const {
    filteredRooms,
    calendarDays,
    loading,
    startDate,
    filters,
    selectedBooking,
    selectedCell,
    roomTypes,
    floors,
    setStartDate,
    setFilters,
    navigateToday,
    navigatePrevious,
    navigateNext,
    selectBooking,
    selectCell,
    clearSelection,
    refreshData,
  } = useRoomCalendar();
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  /* ================= SELECTED ROOM ================= */

  const selectedRoom = selectedCell
    ? filteredRooms.find((r) => r._id === selectedCell.roomId)
    : null;

  /* ================= BOOKING SIDE PANEL ACTIONS ================= */

  // const handleBookingAction = (action: string, booking: Booking) => {
  //   switch (action) {
  //     case "check-in":
  //       toast.success(`Checking in ${booking.guestName || "Guest"}…`);
  //       clearSelection();
  //       break;

  //     case "check-out":
  //       toast.success(`Checking out ${booking.guestName || "Guest"}…`);
  //       clearSelection();
  //       break;

  //     case "edit":
  //       navigate(`/rooms/bookings/${booking._id}/edit`);
  //       break;

  //     case "extend":
  //       toast.info("Extend stay – coming soon");
  //       break;

  //     case "change-room":
  //       toast.info("Change room – coming soon");
  //       break;

  //     case "cancel":
  //       toast.warning("Cancel booking – coming soon");
  //       break;

  //     default:
  //       break;
  //   }
  // };

  return (
    <Layout>
      <div className="space-y-6 h-full relative">
        {/* ================= TOOLBAR ================= */}
        <CalendarToolbar
          startDate={startDate}
          filters={filters}
          roomTypes={roomTypes}
          floors={floors}
          onFiltersChange={setFilters}
          onNavigateToday={navigateToday}
          onNavigatePrevious={navigatePrevious}
          onNavigateNext={navigateNext}
          onDateChange={setStartDate}
          onNewBooking={() => navigate("/rooms/bookings/create")}
          onBlockRooms={() => setIsBlockModalOpen(true)}
        />

        {/* ================= CALENDAR GRID ================= */}
        <RoomCalendarGrid
          rooms={filteredRooms}
          calendarDays={calendarDays}
          loading={loading}
          onCellClick={selectCell}
          onBookingClick={selectBooking}
          selectedBookingId={selectedBooking?._id}
        />

        {/* ================= BOOKING SIDE PANEL ================= */}
        <BookingSidePanel
          booking={selectedBooking}
          isOpen={!!selectedBooking}
          onClose={clearSelection}
          refetch={refreshData}
        />

        {/* ================= CELL ACTIONS PANEL ================= */}
        {selectedCell && (
          <div className="absolute z-50 top-24 left-72">
            <CellActionsPanel
              roomId={selectedCell.roomId}
              dateStr={selectedCell.date}
              onClose={clearSelection}
              onCreateBooking={(roomId, dateStr) => {
                navigate("/rooms/bookings/create", {
                  state: {
                    roomId,
                    roomNumber: selectedRoom?.number,
                    checkIn: dateStr,
                  },
                });
                clearSelection();
              }}
            />
          </div>
        )}
        {isBlockModalOpen && (
          <BlockRoomsModal
            isOpen={isBlockModalOpen}
            onClose={() => setIsBlockModalOpen(false)}
            rooms={filteredRooms} // 🔥 THIS IS KEY
            onSuccess={refreshData} // optional but recommended
          />
        )}
      </div>
    </Layout>
  );
}
