import api from "@/api/authApi";

// ---------------------------------------------
// Create Transaction
// ---------------------------------------------
export const createTransactionApi = async (payload: any) => {
  const res = await api.post("/transactions", payload);
  return res.data; // { success, trx }
};

// ---------------------------------------------
// List Transactions
// ---------------------------------------------
export const listTransactionsApi = async () => {
  const res = await api.get("/transactions");
  return res.data; // { success, trx }
};
