import api from "@/api/authApi";

/* ---------------- CREATE PLAN ---------------- */
export const createPlanApi = async (payload: any) => {
  const res = await api.post("/banquet-plans", payload);
  return res.data;
};

/* ---------------- LIST PLANS ---------------- */
export const getPlansApi = async () => {
  const res = await api.get("/banquet-plans");
  return res.data;
};

/* ---------------- GET SINGLE PLAN ---------------- */
export const getPlanByIdApi = async (planId: string) => {
  const res = await api.get(`/banquet-plans/${planId}`);
  return res.data;
};

/* ---------------- UPDATE PLAN ---------------- */
export const updatePlanApi = async (planId: string, payload: any) => {
  const res = await api.put(`/banquet-plans/${planId}`, payload);
  return res.data;
};

/* ---------------- DELETE PLAN ---------------- */
export const deletePlanApi = async (planId: string) => {
  const res = await api.delete(`/banquet-plans/${planId}`);
  return res.data;
};
