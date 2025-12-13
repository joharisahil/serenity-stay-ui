import api from "@/api/authApi";

export const createManualRestaurantBillApi = async (payload: any) => {
  const res = await api.post("/billing/restaurant/manual", payload);
  return res.data;
};
