// src/api/guestApi.ts
import api from "@/api/authApi";

export const searchGuestsApi = async (
  q: string,
  type: "name" | "phone"
) => {
  const res = await api.get("/guests/search", {
    params: { q, type },
  });

  return res.data.data;
};
