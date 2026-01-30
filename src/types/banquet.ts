export type BanquetCalendarBooking = {
  _id: string;
  eventType: string;
  customerName: string;
  hall: {
    _id: string;
    name: string;
  };
  eventDate: string;
  startTime: string;
  endTime: string;
  bookingStatus: "ENQUIRY" | "TENTATIVE" | "CONFIRMED" | "CANCELLED";
  totals: {
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
  };
};
