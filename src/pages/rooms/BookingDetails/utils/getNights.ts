export const getNights = (checkIn?: string, checkOut?: string) => {
  if (!checkIn || !checkOut) return 1;

  const diff =
    (new Date(checkOut).getTime() -
      new Date(checkIn).getTime()) /
    (1000 * 60 * 60 * 24);

  // Checkout day is NOT charged
  return Math.max(1, Math.ceil(diff));
};
