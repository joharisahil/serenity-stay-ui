export const getPublicMenuApi = async (
  source: string,
  id: string,
  hotelId: string
) => {
  const url = `${import.meta.env.VITE_API_URL}/menu/qr/${source}/${id}/${hotelId}`;

  const res = await fetch(url); // ❌ no token, public endpoint

  if (!res.ok) {
    throw new Error("Failed to fetch menu");
  }

  return res.json();
};
