import api from "@/api/authApi";

export const createCategoryApi = async (payload: any) => {
  const res = await api.post("/menu/category", payload);
  return res.data;
};

export const getCategoriesApi = async () => {
  const res = await api.get("/menu/category");
  return res.data.categories;
};

export const updateCategoryApi = async (id: string, payload: any) => {
  const res = await api.put(`/menu/category/${id}`, payload);
  return res.data.category;
};

export const deleteCategoryApi = async (id: string) => {
  const res = await api.delete(`/menu/category/${id}`);
  return res.data;
};