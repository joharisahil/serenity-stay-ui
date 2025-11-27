import api from "@/api/authApi";

export const createMenuItemApi = async (data: any) => {
  const res = await api.post("/menu/item", data);
  return res.data.item;
};

export const getMenuItemsApi = async (categoryId?: string) => {
  const res = await api.get("/menu/item", {
    params: {
      category_id: categoryId !== "All" ? categoryId : undefined,
    },
  });
  return res.data.items;
};