import api from "@/api/authApi";

export const createRoomApi = async (payload: any) => {
  const res = await api.post("/rooms", payload);
  return res.data;
};

export const listRoomsApi = async () => {
  const res = await api.get("/rooms");
  return res.data;
};

export const getRoomApi = async (roomId: string) => {
  const res = await api.get(`/rooms/${roomId}`);
  return res.data.room;
};

export const updateRoomApi = async (roomId: string, payload: any) => {
  const res = await api.put(`/rooms/${roomId}`, payload);
  return res.data.room;
};

export const deleteRoomApi = async (roomId: string) => {
  const res = await api.delete(`/rooms/${roomId}`);
  return res.data;
};

export const getAllRoomsApi = () =>
  api.get("/rooms").then(res => res.data.rooms);

export const getRoomCurrentBookingApi = (roomId: string) =>
  api.get(`/room-bookings/current/${roomId}`).then(res => res.data.booking);

export const getAvailableRoomsApi = async (hotel_id: any) => {
  const res = await api.get("/rooms/available");
  return res.data;
};