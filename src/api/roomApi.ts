import api from "@/api/authApi";

export const createRoomApi = async (payload: any) => {
  const res = await api.post("/rooms", payload);
  return res.data;
};

export const listRoomsApi = async () => {
  const res = await api.get("/rooms");
  return res.data;
};
