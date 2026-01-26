export const getNights = (checkIn?: string, checkOut?: string) => {
  if (!checkIn || !checkOut) return 1;

  const ci = new Date(checkIn);
  const co = new Date(checkOut);

  // Normalize to midnight
  const inDate = new Date(ci.getFullYear(), ci.getMonth(), ci.getDate());
  const outDate = new Date(co.getFullYear(), co.getMonth(), co.getDate());

  const diffDays = Math.round(
    (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Hotel rule: inclusive of both days
  return Math.max(1, diffDays + 1);
};
