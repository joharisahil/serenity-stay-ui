import api from "@/api/authApi";

export const getRoomTypesApi = () => api.get("/rooms/types").then(res => res.data.types);

export const getRoomsByTypeApi = (type: string) =>
  api.get(`/rooms/list/${type}`).then(res => res.data.rooms);

export const getRoomPlansApi = (roomId: string) =>
  api.get(`/rooms/plans/${roomId}`).then(res => res.data.plans);

export const createBookingApi = (payload: any) =>
  api.post("/room-bookings", payload).then((res) => res.data);

export const getBookingByRoomApi = async (roomId: string) => {
  return api.get(`/room-bookings/current/${roomId}`).then(res => res.data);
};
