import api from "@/api/authApi";

/* -------- CREATE HALL -------- */
export const createHallApi = async (payload: any) => {
  const res = await api.post("/banquets", payload);
  return res.data.hall;
};

/* -------- LIST HALLS -------- */
export const getHallsApi = async () => {
  const res = await api.get("/banquets");
  return res.data.halls;
};

/* -------- UPDATE HALL -------- */
export const updateHallApi = async (id: string, payload: any) => {
  const res = await api.put(`/banquets/${id}`, payload);
  return res.data.hall;
};

/* -------- DELETE HALL -------- */
export const deleteHallApi = async (id: string) => {
  const res = await api.delete(`/banquets/${id}`);
  return res.data;
};
