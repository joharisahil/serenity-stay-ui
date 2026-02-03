import api from "@/api/authApi";

/* ----------------------------
   CREATE ROOM
-----------------------------*/
export const createRoomApi = async (payload: any) => {
  const res = await api.post("/rooms", payload);
  return res.data;
};

/* ----------------------------
   LIST ALL ROOMS
-----------------------------*/
export const listRoomsApi = async () => {
  const res = await api.get("/rooms");
  return res.data; // older callers expected res.data or res.data.rooms; this returns whole payload
};

/* ----------------------------
   GET ROOM BY ID
-----------------------------*/
export const getRoomApi = async (roomId: string) => {
  const res = await api.get(`/rooms/${roomId}`);
  return res.data.room;
};

/* ----------------------------
   UPDATE ROOM
-----------------------------*/
export const updateRoomApi = async (roomId: string, payload: any) => {
  const res = await api.put(`/rooms/${roomId}`, payload);
  return res.data.room;
};

/* ----------------------------
   DELETE ROOM
-----------------------------*/
export const deleteRoomApi = async (roomId: string) => {
  const res = await api.delete(`/rooms/${roomId}`);
  return res.data;
};

/* ----------------------------
   GET ALL ROOMS (returns rooms array)
-----------------------------*/
export const getAllRoomsApi = async () => {
  const res = await api.get("/rooms");
  return res.data.rooms;
};

/* ----------------------------
   GET CURRENT BOOKING FOR ROOM
   - GET /room-bookings/current/:roomId
   - Return format matches earlier helper (res.data.booking)
-----------------------------*/
export const getRoomCurrentBookingApi = async (roomId: string) => {
  const res = await api.get(`/room-bookings/current/${roomId}`);
  return res.data.booking;
};

/* ----------------------------
   GET AVAILABLE ROOMS (LEGACY: no datetime)
   - GET /rooms/available
   - Returns res.data or res.data.rooms depending on your backend
-----------------------------*/
export const getAvailableRoomsLegacyApi = async () => {
  const res = await api.get("/rooms/available");
  return res.data;
};

/* ----------------------------
   GET ROOMS BY TYPE
   - Primary: /rooms/type/:type
   - Fallback (legacy): /rooms/list/:type
   - Returns rooms array
-----------------------------*/
export const getRoomsByTypeApi = async (type: string) => {
  try {
    const res = await api.get(`/rooms/type/${encodeURIComponent(type)}`);
    return res.data.rooms;
  } catch (err: any) {
    // fallback
    const res = await api.get(`/rooms/list/${encodeURIComponent(type)}`);
    return res.data.rooms;
  }
};

/* ----------------------------
   GET AVAILABLE ROOMS BETWEEN DATETIME RANGE (NEW)
   - GET /rooms/date/available?checkIn=...&checkOut=...&type=...
   - Returns rooms array with metadata (hasSameDayCheckout, checkoutTime)
-----------------------------*/
export const getAvailableRoomsByDateApi = async (
  checkIn: string,
  checkOut: string,
  type?: string
) => {
  const params = new URLSearchParams({ checkIn, checkOut });
  if (type) params.append("type", type);
  const res = await api.get(`/rooms/date/available?${params.toString()}`);
  return res.data.rooms;
};

export const getAllRoomsByDateApi = async (checkIn, checkOut) => {
  const params = new URLSearchParams({ checkIn, checkOut });
  const res = await api.get(`/rooms/date/all?${params.toString()}`);
  return res.data.rooms;
};

/* ----------------------------
   GET ROOM TYPES
-----------------------------*/
export const getRoomTypesApi = async () => {
  const res = await api.get("/rooms/types");
  return res.data.types;
};

/* ----------------------------
   GET ROOM PLANS
   - new: /rooms/:roomId/plans
   - legacy fallback: /rooms/plans/:roomId
-----------------------------*/
export const getRoomPlansApi = async (roomId: string) => {
    const res = await api.get(`/rooms/plans/${roomId}`);
    return res.data.plans;
};


/* ----------------------------
   ROOM CALENDAR (V2)
   - GET /rooms/calendar/view?from=YYYY-MM-DD&to=YYYY-MM-DD
   - Returns { success, bookings }
-----------------------------*/
export const getRoomCalendarApi = async (
  from: string,
  to: string
) => {
  const params = new URLSearchParams({ from, to });
  const res = await api.get(`/rooms/calendar/view?${params.toString()}`);
  return res.data;
};
