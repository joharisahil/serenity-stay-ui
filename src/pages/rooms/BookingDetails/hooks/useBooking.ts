import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getBookingApi,
  getTodayBookingByRoomApi,
  getRoomServiceBillForBookingApi,
} from "@/api/bookingApi";
import { getHotelApi } from "@/api/hotelApi";
import { getAvailableRoomsApi } from "@/api/bookingApi";
import { getAvailableRoomsByDateApi } from "@/api/roomApi";
import { Booking, Hotel, RoomOrder, RoomOrderSummary } from "../BookingDetails.types";

interface UseBookingParams {
  roomId: string | undefined;
  passedBookingId: string | null;
  selectedCheckIn: string | null;
  selectedCheckOut: string | null;
}

export function useBooking({
  roomId,
  passedBookingId,
  selectedCheckIn,
  selectedCheckOut,
}: UseBookingParams) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [roomOrders, setRoomOrders] = useState<RoomOrder[]>([]);
  const [roomOrderSummary, setRoomOrderSummary] = useState<RoomOrderSummary | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookingData = async () => {
    if (!roomId) return;

    setLoading(true);

    try {
      let bookingData;

      if (passedBookingId) {
        bookingData = await getBookingApi(passedBookingId);
      } else {
        const res = await getTodayBookingByRoomApi(roomId);
        bookingData = res.booking || null;
      }

      setBooking(bookingData);

      if (bookingData?.hotel_id) {
        try {
          const hotelRes = await getHotelApi(bookingData.hotel_id);
          if (hotelRes?.success) setHotel(hotelRes.hotel);
          else setHotel(null);
        } catch (e) {
          setHotel(null);
        }
      } else {
        setHotel(null);
      }

      try {
        const foodRes = await getRoomServiceBillForBookingApi(bookingData._id);
        if (foodRes.success) {
          setRoomOrders(foodRes.orders || []);
          setRoomOrderSummary(foodRes.summary || null);
        } else {
          setRoomOrders([]);
          setRoomOrderSummary(null);
        }
      } catch (e) {
        setRoomOrders([]);
        setRoomOrderSummary(null);
      }

      if (bookingData?.room_id?.type) {
        try {
          const type = bookingData.room_id.type;
          let availableSameType = [];

          if (passedBookingId && selectedCheckIn && selectedCheckOut) {
            availableSameType = await getAvailableRoomsByDateApi(
              selectedCheckIn,
              selectedCheckOut,
              type
            );
          } else {
            const simple = await getAvailableRoomsApi(type);
            availableSameType = simple || [];
          }

          setAvailableRooms(availableSameType);
        } catch (e) {
          setAvailableRooms([]);
        }
      }
    } catch (e) {
      toast.error("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

 const refreshBooking = async (bookingId?: string) => {
  const id = bookingId ?? booking?._id;
  if (!id) return;

  try {
    const updated = await getBookingApi(id);
    setBooking(updated);

    const foodRes = await getRoomServiceBillForBookingApi(id);
    setRoomOrders(foodRes.orders || []);
    setRoomOrderSummary(foodRes.summary || null);
  } catch (e) {
    console.error(e);
  }
};


  useEffect(() => {
    loadBookingData();
  }, [roomId, passedBookingId, selectedCheckIn, selectedCheckOut]);

  return {
    booking,
    setBooking,
    roomOrders,
    setRoomOrders,
    roomOrderSummary,
    setRoomOrderSummary,
    hotel,
    availableRooms,
    setAvailableRooms,
    loading,
    refreshBooking,
  };
}
