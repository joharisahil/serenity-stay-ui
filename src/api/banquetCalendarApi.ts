import api from "@/api/authApi";
import { BanquetCalendarBooking } from "@/types/banquet";

type CalendarParams = {
  from: string;
  to: string;
  hallId?: string;
};

export const getBanquetBookingsForCalendarApi = async (
  params: CalendarParams
): Promise<BanquetCalendarBooking[]> => {
  const res = await api.get("/banquet-bookings/booking", {
    params,
  });

  return res.data.bookings as BanquetCalendarBooking[];
};
