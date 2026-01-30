import api from "@/api/authApi";

/**
 * Revenue Summary API
 * range = TODAY | WEEK | MONTH | YEAR
 */
export const getRevenueSummaryApi = async (range: string) => {
  const res = await api.get(
    `/dashboard/revenue-summary?range=${range.toUpperCase()}`
  );
  return res.data;
};

export const downloadSummaryApi = async (range: string, type: string) => {
  const res = await api.get(
    `/dashboard/download-summary?range=${range}&type=${type}`
  );
  return res.data;
};

