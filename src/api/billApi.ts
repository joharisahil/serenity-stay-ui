import api from "@/api/authApi";

// restaurant + banquet bills
export const getBillsApi = async (params: any) => {
  const res = await api.get("/billing", { params });
  return res.data;
};

// room invoices only
export const getRoomBillsApi = async (params: any) => {
  const res = await api.get("/billing/room", { params });
  return res.data;
};

// Get a single bill
export const getBillByIdApi = async (billId: string) => {
  const res = await api.get(`/billing/${billId}`);
  return res.data;
};

export const getRoomBillByIdApi = async (billId: string) => {
  const res = await api.get(`/billing/room/${billId}`);
  return res.data;
};
