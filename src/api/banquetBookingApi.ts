import api from "@/api/authApi";

/* =====================================================
   TYPES (optional but recommended)
===================================================== */

export type CheckAvailabilityParams = {
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
};

export type CreateBanquetBookingPayload = {
  customerName: string;
  customerPhone: string;
  eventType: string;
  notes?: string;

  eventDate: string;
  startTime: string;
  endTime: string;

  hallId: string;
  isHallComplimentary?: boolean;

  guestsCount: number;

  pricingMode: "PLAN" | "CUSTOM_FOOD" | "HALL_ONLY";

  planId?: string;
  planItems?: any[];

  customFoodAmount?: number;

  services?: {
    name: string;
    amount: number;
    chargeable: boolean;
  }[];

  discount?: {
    type: "PERCENT" | "FLAT";
    value: number;
    reason?: string;
  };

  gstPercent?: number;

  payments?: {
    type: "ADVANCE" | "FINAL";
    amount: number;
    mode: string;
    date: string;
    reference?: string;
  }[];
};

/* =====================================================
   API CALLS
===================================================== */

/**
 * ✅ Check available halls for a date & time slot
 * GET /banquet-bookings/available-halls
 */
export const getAvailableHallsApi = async (
  params: CheckAvailabilityParams
) => {
  const res = await api.get("/banquet-bookings/available-halls", {
    params,
  });

  return res.data; // { success, halls }
};

/**
 * ✅ Create banquet booking
 * POST /banquet-bookings/booking
 */
export const createBanquetBookingApi = async (
  payload: CreateBanquetBookingPayload
) => {
  const res = await api.post("/banquet-bookings/booking", payload);
  return res.data; // { success, booking }
};

/**
 * ✅ List banquet bookings
 * GET /banquet-bookings/booking
 */
export const getBanquetBookingsApi = async (params?: {
  status?: string;
  from?: string;
  to?: string;
}) => {
  const res = await api.get("/banquet-bookings/booking", { params });
  return res.data; // { success, bookings }
};

/**
 * ✅ Get single booking by ID
 * (useful for Edit Booking page later)
 */
export const getBanquetBookingByIdApi = async (id: string) => {
  const res = await api.get(`/banquet-bookings/booking/${id}`);
  return res.data; // { success, booking }
};

/**
 * ✅ Update banquet booking
 * PUT /banquet-bookings/booking/:id
 */
export const updateBanquetBookingApi = async (
  id: string,
  payload: Partial<CreateBanquetBookingPayload>
) => {
  const res = await api.put(`/banquet-bookings/booking/${id}`, payload);
  return res.data;
};

/**
 * ✅ Cancel banquet booking
 * PUT /banquet-bookings/booking/:id/cancel
 */
export const cancelBanquetBookingApi = async (id: string) => {
  const res = await api.delete(`/banquet-bookings/booking/${id}`);
  return res.data;
};
