export const getNights = (checkIn?: string, checkOut?: string) => {
  if (!checkIn || !checkOut) return 1;

  const ci = new Date(checkIn);
  const co = new Date(checkOut);

  // Normalize to midnight
  ci.setHours(0, 0, 0, 0);
  co.setHours(0, 0, 0, 0);

  const diffMs = co.getTime() - ci.getTime();
  const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(1, nights);
};