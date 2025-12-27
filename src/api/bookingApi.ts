// src/api/bookingApi.ts
import api from "@/api/authApi";

/**
 * Helper: try a request, if it fails (404 or network) optionally try fallback
 */
async function tryRequest(primary: () => Promise<any>, fallback?: () => Promise<any>) {
  try {
    return await primary();
  } catch (err: any) {
    // if fallback provided, try it
    if (fallback) {
      try {
        return await fallback();
      } catch (e) {
        throw e;
      }
    }
    throw err;
  }
}

/* ----------------------------
   ROOM TYPES
   - Primary: GET /rooms/types
-----------------------------*/
export const getRoomTypesApi = async () => {
  const res = await api.get("/rooms/types");
  return res.data.types;
};

/* ----------------------------
   ROOMS BY TYPE
   - Prefer new: /rooms/type/:type
   - Fallback (legacy): /rooms/list/:type
   Returns: array of rooms
-----------------------------*/
export const getRoomsByTypeApi = async (type: string) => {
  return tryRequest(
    () => api.get(`/rooms/type/${encodeURIComponent(type)}`).then(r => r.data.rooms),
    () => api.get(`/rooms/list/${encodeURIComponent(type)}`).then(r => r.data.rooms)
  );
};

/* ----------------------------
   ROOM PLANS
   - Prefer: /rooms/:roomId/plans
   - Fallback (legacy): /rooms/plans/:roomId
   Returns: array of plans
-----------------------------*/
// export const getRoomPlansApi = async (roomId: string) => {
//   return tryRequest(
//     () => api.get(`/rooms/${roomId}/plans`).then(r => r.data.plans),
//     () => api.get(`/rooms/plans/${roomId}`).then(r => r.data.plans)
//   );
// };

/* ----------------------------
   CREATE BOOKING
   - POST /room-bookings
   NOTE: older callers expected full res.data, newer sometimes expect res.data.booking
   We'll return res.data (so old callers work). New callers can pick .booking if needed.
-----------------------------*/
export const createBookingApi = async (payload: any) => {
  const res = await api.post("/room-bookings", payload);
  return res.data; // contains booking under res.data.booking (and other metadata)
};

/* ----------------------------
   GET BOOKING BY ID
   - GET /room-bookings/:id
   Returns booking object (res.data.booking)
-----------------------------*/
export const getBookingApi = async (bookingId: string) => {
  const res = await api.get(`/room-bookings/${bookingId}`);
  return res.data.booking;
};
export const getBookingByDateRangeApi = async (roomId: string, checkIn: string, checkOut: string) => {
  const params = new URLSearchParams({ roomId, checkIn, checkOut });
  const res = await api.get(`/room-bookings/by-date?${params.toString()}`);
  return res.data.booking;
};

/* -----------------------------------------------------------
   ⭐ UPDATE ROOM BILLING (GST + Discount)
------------------------------------------------------------ */
export const updateRoomBillingApi = async (
  bookingId: string,
  payload: { 
    discount: number;
    discountScope?: "TOTAL" | "ROOM" | "EXTRAS";
    gstEnabled: boolean;
    roundOffEnabled?: boolean; }
) => {
  const res = await api.patch(
    `/room-bookings/${bookingId}/room-billing`,
    payload
  );
  return res.data.booking;
};

/* -----------------------------------------------------------
   ⭐ UPDATE FOOD BILLING (GST + Discount)
------------------------------------------------------------ */
export const updateFoodBillingApi = async (
  bookingId: string,
  payload: { foodDiscount: number; foodGSTEnabled: boolean }
) => {
  const res = await api.patch(
    `/room-bookings/${bookingId}/food-billing`,
    payload
  );
  return res.data.booking;
};

/* ------


/* ----------------------------
   GET CURRENT BOOKING FOR A ROOM
   - GET /room-bookings/current/:roomId
   Legacy code used a function named getBookingByRoomApi that returned res.data
   We'll keep backward compatibility: provide both function names.
-----------------------------*/
export const getRoomCurrentBookingApi = async (roomId: string) => {
  const res = await api.get(`/room-bookings/current/${roomId}`);
  return res.data.booking;
};

export const getBookingByRoomApi = async (roomId: string) => {
  // legacy callers expect res.data shape
  const res = await api.get(`/room-bookings/current/${roomId}`);
  return res.data; // old code used .then(res => res.data)
};
export const getTodayBookingByRoomApi = async (roomId: string) => {
  const res = await api.get(`/rooms/current/today/${roomId}`);
  return res.data;
};
export const getRoomServiceBillForBookingApi = async (bookingId: string) => {
  const res = await api.get(`/room-bookings/orders/booking/${bookingId}`);
  return res.data;
};

/* ----------------------------
   CHECKOUT / CANCEL / CHANGE ROOM / EXTEND STAY
   - Keep endpoints and return res.data for compatibility
-----------------------------*/
export const checkoutBookingApi = async (bookingId: string, payload?: any) => {
  const res = await api.post(`/room-bookings/${bookingId}/checkout`, payload || {});
  return res.data;
};


export const cancelBookingApi = async (bookingId: string) => {
  const res = await api.post(`/room-bookings/${bookingId}/cancel`);
  return res.data;
};

export const changeRoomApi = async (bookingId: string, newRoomId: string) => {
  const res = await api.post(`/room-bookings/${bookingId}/change-room`, { newRoomId });
  return res.data;
};

export const extendStayApi = async (bookingId: string, newCheckOut: string) => {
  const res = await api.post(`/room-bookings/${bookingId}/extend-stay`, { newCheckOut });
  return res.data;
};

/* ----------------------------
   GET AVAILABLE ROOMS (LEGACY)
   - GET /rooms/available?type=...
   - kept for old callers that still call getAvailableRoomsApi(type)
   Returns: array of rooms (res.data.rooms)
-----------------------------*/
export const getAvailableRoomsApi = async (type?: string) => {
  const qs = type ? `?type=${encodeURIComponent(type)}` : "";
  const res = await api.get(`/rooms/available${qs}`);
  // older code expected res.data.rooms
  return res.data.rooms;
};

/* ----------------------------
   GET AVAILABLE ROOMS BETWEEN DATETIME RANGE (NEW)
   - GET /rooms/date/available?checkIn=...&checkOut=...&type=...
   - Returns array of rooms with metadata (hasSameDayCheckout, checkoutTime)
   - Provide a fallback to same endpoint if it fails (no legacy equivalent)
-----------------------------*/
export const getAvailableRoomsByDateTimeApi = async (
  checkIn: string,
  checkOut: string,
  type?: string
) => {
  const params = new URLSearchParams({ checkIn, checkOut });
  if (type) params.append("type", type);

  const res = await api.get(`/rooms/date/available?${params.toString()}`);
  return res.data.rooms;
};

// ---------------- EDIT METADATA ----------------
export const updateGuestInfoApi = (id: string, payload: any) =>
  api.patch(`/room-bookings/${id}/guest`, payload);

export const updateGuestIdsApi = (id: string, guestIds: any[]) =>
  api.patch(`/room-bookings/${id}/guest-ids`, { guestIds });

export const updateCompanyDetailsApi = (id: string, payload: any) =>
  api.patch(`/room-bookings/${id}/company`, payload);

// ---------------- REDUCE STAY ----------------
export const reduceStayApi = (id: string, newCheckOut: string) =>
  api.patch(`/room-bookings/${id}/reduce-stay`, { newCheckOut });

export const updateBookingServicesApi = (id: string, services: any[]) =>
  api.patch(`/room-bookings/${id}/services`, { addedServices: services });
