import api from "@/api/authApi";

export const getHotelApi = async (id: string) => {
  const res = await api.get(`/hotels/${id}`);
  return res.data; // { success: true, hotel }
};
