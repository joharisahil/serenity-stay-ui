import { useEffect, useState, useCallback } from "react";
import { resolveBookingApi } from "@/api/bookingApi";
import { getHotelApi } from "@/api/hotelApi";
import { getRoomServiceBillForBookingApi } from "@/api/bookingApi";

export function useBooking({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<any>(null);
  const [roomOrders, setRoomOrders] = useState<any[]>([]);
  const [roomOrderSummary, setRoomOrderSummary] = useState<any>(null);
  const [hotel, setHotel] = useState<any>(null);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooking = useCallback(async () => {
    if (!bookingId) return;

    setLoading(true);
    try {
      // 🔥 ONLY bookingId resolver
      const bookingData = await resolveBookingApi({ bookingId });

      if (!bookingData) {
        setBooking(null);
        return;
      }

      setBooking(bookingData);

      if (bookingData.hotel_id) {
        const h = await getHotelApi(bookingData.hotel_id);
        setHotel(h?.hotel ?? null);
      }

      const food = await getRoomServiceBillForBookingApi(bookingData._id);
      setRoomOrders(food.orders || []);
      setRoomOrderSummary(food.summary || null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  return {
    booking,
    roomOrders,
    roomOrderSummary,
    hotel,
    availableRooms,
    loading,
    refreshBooking: loadBooking,
  };
}
