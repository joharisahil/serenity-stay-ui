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

export const startQrSessionApi = async (source: string, id: string, hotelId: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/qr/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, id, hotelId })
  });

  if (!res.ok) throw new Error("Failed to start QR session");

  return res.json();
};
