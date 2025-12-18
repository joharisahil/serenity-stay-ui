import api from "./api"; // your axios instance

export const createPublicOrderApi = async (payload: any) => {
  const res = await api.post("/orders", payload, {
    headers: {
      Authorization: "", // override token → public API
    },
  });
  return res.data;
};

export const getLiveOrdersApi = (hotelId: string) =>
  api.get(`/orders/live/${hotelId}`).then(res => res.data);

export const updateOrderStatusApi = (orderId: string, status: string) =>
  api.post(`/orders/${orderId}/status`, { status }).then(res => res.data);

export const createManualOrderApi = async (payload: any) => {
  const res = await api.post("orders/manual", payload);
  return res.data;
};
