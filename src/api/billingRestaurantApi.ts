import api from "@/api/authApi";

// ---------------------------------------------
// Fetch pending tables (delivered orders, unpaid)
// GET /billing/restaurant/pending
// ---------------------------------------------
export const getPendingRestaurantTablesApi = async () => {
  const res = await api.get("/billing-restaurant/pending");
  return res.data; // { success, tables }
};

// ---------------------------------------------
// Get bill for a specific table
// GET /billing/restaurant/table/:tableId
// ---------------------------------------------
export const getRestaurantTableBillApi = async (tableId: string) => {
  const res = await api.get(`/billing-restaurant/table/${tableId}`);
  return res.data; // { success, orders, summary }
};

// ---------------------------------------------
// Checkout & generate bill
// POST /billing/restaurant/checkout
// ---------------------------------------------
export const checkoutRestaurantBillApi = async (payload: {
  table_id: string;
  discount?: number;
  paymentMode?: string;
}) => {
  const res = await api.post("/billing-restaurant/checkout", payload);
  return res.data; // { success, transaction, invoiceId }
};

export const getPendingRoomBillsApi = () =>
  api.get("/billing-restaurant/pending-rooms").then(res => res.data);

export const getRoomServiceBillApi = async (roomId: string) => {
  const res = await api.get(`/billing-restaurant/room/${roomId}`);
  return res.data;
};

export const transferRestaurantBillToRoomApi = (payload) =>
  api.post("/billing/restaurant/transfer", payload);