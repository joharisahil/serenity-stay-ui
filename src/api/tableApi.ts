import api from "@/api/authApi";

export const createTableApi = async (payload: any) => {
  const res = await api.post("/tables", payload);
  return res.data;
};

export const listTablesApi = async () => {
  const res = await api.get("/tables");
  return res.data;
};

export const getTableApi = async (id: string) => {
  const res = await api.get(`/tables/${id}`);
  return res.data.table;
};

export const updateTableApi = async (tableId: string, payload: any) => {
  const res = await api.put(`/tables/${tableId}`, payload);
  return res.data.table;
};

export const deleteTableApi = async (tableId: string) => {
  const res = await api.delete(`/tables/${tableId}`);
  return res.data;
};


