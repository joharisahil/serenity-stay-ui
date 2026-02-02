import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { CalendarToolbar } from "./components/CalendarToolbar";
import { RoomCalendarGrid } from "./components/RoomCalendarGrid";
import { BookingSidePanel } from "./components/BookingSidePanel";
import { CellActionsPanel } from "./components/CellActionsPanel";



import { useRoomCalendar } from "./hooks/useRoomCalendar";
import type { Booking } from "@/api/bookingApi";

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
  } = useRoomCalendar();

  // Get selected room info for cell actions panel
  const selectedRoom = selectedCell
    ? filteredRooms.find(r => r._id === selectedCell.roomId)
    : null;

  // Handle booking actions
  const handleBookingAction = (action: string, booking: Booking) => {
    switch (action) {
      case "check-in":
        toast.success(`Checking in ${booking.guestName}...`);
        clearSelection();
        break;
      case "check-out":
        toast.success(`Checking out ${booking.guestName}...`);
        clearSelection();
        break;
      case "change-room":
        toast.info("Room change feature coming soon");
        break;
      case "extend":
        toast.info("Extend stay feature coming soon");
        break;
      case "edit":
        navigate(`/rooms/bookings/${booking._id}/edit`);
        break;
      case "cancel":
        toast.warning("Cancel booking feature coming soon");
        break;
      default:
        break;
    }
  };

  // Handle cell actions
  const handleCellAction = (action: string) => {
    if (!selectedCell || !selectedRoom) return;

    switch (action) {
      case "new-booking":
        navigate("/rooms/bookings/create", {
          state: {
            roomId: selectedCell.roomId,
            roomNumber: selectedRoom.number,
            checkIn: selectedCell.date,
          },
        });
        break;
      case "walk-in":
        navigate("/rooms/bookings/create", {
          state: {
            roomId: selectedCell.roomId,
            roomNumber: selectedRoom.number,
            checkIn: selectedCell.date,
            source: "WALK_IN",
            immediateCheckIn: true,
          },
        });
        break;
      case "block":
        toast.info("Block room feature coming soon");
        clearSelection();
        break;
      default:
        break;
    }
  };

  return (
    <Layout className="pb-0">
      <div className="space-y-6 h-full">
        {/* Toolbar */}
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
        />

        {/* Calendar Grid */}
        <RoomCalendarGrid
          rooms={filteredRooms}
          calendarDays={calendarDays}
          loading={loading}
          onCellClick={selectCell}
          onBookingClick={selectBooking}
          selectedBookingId={selectedBooking?._id}
        />

        {/* Booking Side Panel */}
        <BookingSidePanel
          booking={selectedBooking}
          isOpen={!!selectedBooking}
          onClose={clearSelection}
          onAction={handleBookingAction}
        />

        {/* Cell Actions Panel */}
        <CellActionsPanel
          roomId={selectedCell?.roomId || ""}
          roomNumber={selectedRoom?.number || ""}
          date={selectedCell?.date || ""}
          isOpen={!!selectedCell}
          onClose={clearSelection}
          onAction={handleCellAction}
        />
      </div>
    </Layout>
  );
}
