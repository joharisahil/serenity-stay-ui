import { Booking, BillingData } from "../BookingDetails.types";

export function mapBookingToBillingData(booking: Booking): BillingData {
  return {
    nights:
      booking.nights ||
      Math.ceil(
        (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    roomPrice: booking.room_id.baseRate || 0,
    roomStayTotal: booking.roomStayTotal || booking.room_id.baseRate || 0,
    extrasBase: booking.extrasBase || 0,
    extrasGST: booking.extrasGST || 0,
    extrasTotal: booking.extrasTotal || 0,
    taxable: booking.taxable || 0,
    cgst: booking.cgst || 0,
    sgst: booking.sgst || 0,
    foodTotals: booking.foodTotals || { subtotal: 0, gst: 0, total: 0 },
    advancePaid: booking.advancePaid || 0,
    balanceDue: booking.balanceDue || 0,
    roundOffAmount: booking.roundOffAmount || 0,
    roundOffEnabled: booking.roundOffEnabled,
    grandTotal: booking.grandTotal || booking.balanceDue + (booking.advancePaid || 0),
  };
}
