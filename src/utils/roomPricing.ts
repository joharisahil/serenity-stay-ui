export function getRoomPricingView({
  booking,
  billingData,
  gstRate = 5,
}: {
  booking: any;
  billingData: any;
  gstRate?: number;
}) {
  const nights = billingData.nights || 1;

  const isOfferPricing =
    booking.pricingType === "FINAL_INCLUSIVE" &&
    Number(booking.finalRoomPrice) > 0;

  // Reverse GST helper
  const reverseGST = (amount: number) =>
    +(amount / (1 + gstRate / 100)).toFixed(2);

  // ---- PLAN PRICE (UI reference only) ----
  const planBasePerNight = billingData.roomPrice || 0;
  const planBaseTotal = +(planBasePerNight * nights).toFixed(2);

  // ---- OFFER PRICE ----
  const offerBasePerNight = isOfferPricing
    ? reverseGST(Number(booking.finalRoomPrice))
    : 0;

  const offerBaseTotal = +(offerBasePerNight * nights).toFixed(2);

  // ---- DISPLAY BASE ----
  const displayBasePerNight = isOfferPricing
    ? offerBasePerNight
    : planBasePerNight;

  const displayBaseTotal = isOfferPricing
    ? offerBaseTotal
    : planBaseTotal;

  // ---- DISCOUNT (visual only) ----
  const offerDiscount =
    isOfferPricing && planBaseTotal > offerBaseTotal
      ? +(planBaseTotal - offerBaseTotal).toFixed(2)
      : 0;

  return {
    nights,

    // flags
    isOfferPricing,

    // per-night
    displayBasePerNight,

    // totals
    displayBaseTotal,
    planBaseTotal,
    offerBaseTotal,

    // discount
    offerDiscount,

    // labels
    priceLabel: isOfferPricing ? "Offer Price Applied" : "Room Charges",
  };
}
