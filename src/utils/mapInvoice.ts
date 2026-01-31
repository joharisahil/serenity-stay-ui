export function mapRoomInvoice(bill: any) {
  const inv = bill.fullInvoice;

  if (!inv) {
    throw new Error("Room invoice data missing");
  }

  /* =========================
     HELPERS
  ========================= */
 const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

  /* =========================
     EXTRA SERVICES (NORMALIZED)
  ========================= */
  const extraServices = (inv.extraServices || []).map((s: any) => {
    const days = Array.isArray(s.days) ? s.days.length : 1;
    const total = num(s.price) * days;

    return {
      name: s.name,
      price: num(s.price),
      days,
      total,
      gstEnabled: !!s.gstEnabled,
    };
  });
 

const calculateExtraServicesTotal = (extraServices: any[] = []) => {
  return extraServices.reduce((sum: number, s: any) => {
    const price = num(s.price);
    const days = Array.isArray(s.days) ? s.days.length : 1;
    return sum + price * days;
  }, 0);
};


  /* =========================
     FOOD NORMALIZATION
  ========================= */
  const foodOrders = inv.foodOrders || [];

  const foodTotals = {
    subtotal: num(inv.foodSubtotalRaw),
    discountAmount: num(inv.foodDiscountAmount),
    subtotalAfterDiscount: num(inv.foodSubtotalAfterDiscount),
    gst: num(inv.foodGST),
    total: num(inv.foodTotal),
  };


  /* =========================
     ROOM TAX (BACKEND TRUTH)
  ========================= */
  const extraServicesTemp = inv.extraServices || [];

const extraServicesTotal = calculateExtraServicesTotal(extraServicesTemp);

const taxable =
  inv.taxable !== undefined
    ? num(inv.taxable)
    : num(inv.stayAmount) + extraServicesTotal;


  const cgst =
    inv.cgst !== undefined ? num(inv.cgst) : num(inv.stayCGST);

  const sgst =
    inv.sgst !== undefined ? num(inv.sgst) : num(inv.staySGST);

  const roomNet =
    inv.roomNet !== undefined
      ? num(inv.roomNet)
      : taxable + cgst + sgst;

  /* =========================
     FINAL OBJECT (CONSUMED BY INVOICE BUILDER)
  ========================= */
  return {
    /* ---------- META ---------- */
    invoiceNumber: inv.invoiceNumber,
    createdAt: inv.createdAt,

    /* ---------- HOTEL ---------- */
    hotel: {
      name: bill.hotel?.name,
      address: bill.hotel?.address,
      phone: bill.hotel?.phone,
      gstNumber: bill.hotel?.gstNumber,
    },

    /* ---------- GUEST ---------- */
    guest: {
      name: inv.guestName,
      phone: inv.guestPhone,
      city: inv.guestCity,
      nationality: inv.guestNationality,
      address: inv.guestAddress,
      ids: inv.guestIds || [],
    },

    /* ---------- COMPANY (OPTIONAL) ---------- */
    company: inv.companyName
      ? {
          name: inv.companyName,
          gstin: inv.companyGSTIN || "",
          address: inv.companyAddress || "",
        }
      : null,

    /* ---------- STAY ---------- */
    stay: {
      roomNumber: inv.roomNumber || inv.room_id?.number,
      roomType: inv.roomType || inv.room_id?.type,
      checkIn: inv.checkIn,
      checkOut: inv.actualCheckoutTime,
      nights: num(inv.stayNights),
      roomRate: num(inv.roomRate),
      stayAmount: num(inv.stayAmount),
    },

    /* ---------- EXTRA SERVICES ---------- */
    extraServices,

    /* ---------- ROOM TAX ---------- */
    roomTax: {
      taxable,
      cgst,
      sgst,
      totalGST: cgst + sgst,
      roomNet,
    },

    /* ---------- FOOD ---------- */
    food: {
      orders: foodOrders,
      totals: foodTotals,
    },

    /* ---------- PAYMENTS ---------- */
    payments: {
      advancePaid: num(inv.advancePaid),
      advancePaymentMode: inv.advancePaymentMode || "N/A",

      finalPaymentReceived: !!inv.finalPaymentReceived,
      finalPaymentMode: inv.finalPaymentMode || "N/A",
      finalPaymentAmount: num(inv.finalPaymentAmount),

      balanceDue: num(inv.balanceDue),
    },

    /* ---------- GRAND TOTAL ---------- */
    totals: {
      roomNet,
      foodTotal: num(inv.foodTotal),
      grandTotal: num(inv.totalAmount ?? inv.grandTotal),
    },
  };
}
