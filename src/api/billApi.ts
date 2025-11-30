import api from "@/api/authApi";

// Get all bills
export const getAllBillsApi = async () => {
  const res = await api.get("/billing"); 
  return res.data;
};

// Get a single bill
export const getBillByIdApi = async (billId: string) => {
  const res = await api.get(`/billing/${billId}`);
  return res.data;
};
