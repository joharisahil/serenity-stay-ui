// import { toast } from "sonner";
// import { updateRoomBillingApi } from "@/api/bookingApi";
// import { Booking, BillingData } from "../BookingDetails.types";
// import { fmt } from "../utils/formatters";

// interface BillingSummarySectionProps {
//   booking: Booking;
//   billingData: BillingData | null;
//   totalAdvance: number;
//   finalPaymentReceived: boolean;
//   finalPaymentMode: string;
//   onFinalPaymentReceivedChange: (received: boolean) => void;
//   onFinalPaymentModeChange: (mode: string) => void;
//   onRefresh: () => void;
// }

// export function BillingSummarySection({
//   booking,
//   billingData,
//   finalPaymentReceived,
//   finalPaymentMode,
//   onFinalPaymentReceivedChange,
//   onFinalPaymentModeChange,
//   onRefresh,
// }: BillingSummarySectionProps) {
//   if (!booking || !billingData) return null;

//   return (
//     <div className="border rounded-md p-4 bg-secondary/30 space-y-3">
//       <div className="flex justify-between font-medium">
//         <span>Grand Total</span>
//         <span>₹{fmt(billingData.grandTotal)}</span>
//       </div>

//       <div className="flex justify-between text-success">
//         <span>Advance Paid ( Room )</span>
//         <span>₹{fmt(booking.advancePaid)}</span>
//       </div>

//       <div className="flex justify-between font-bold text-lg border-t pt-2">
//         <span>Balance Due</span>
//         <span className="text-warning">
//           ₹{fmt(finalPaymentReceived ? 0 : booking.balanceDue)}
//         </span>
//       </div>

//       <div className="flex justify-between items-center">
//         <label className="font-medium">Round Off Total</label>
//         <input
//           type="checkbox"
//           checked={booking.roundOffEnabled}
//           onChange={async (e) => {
//             await updateRoomBillingApi(booking._id, {
//               discount: booking.discount,
//               gstEnabled: booking.gstEnabled,
//               roundOffEnabled: e.target.checked,
//             });
//             onRefresh();
//           }}
//         />
//       </div>

//       {booking.roundOffEnabled && (
//         <div className="flex justify-between text-sm text-muted-foreground">
//           <span>Round Off Adjustment</span>
//           <span>₹{booking.roundOffAmount || 0}</span>
//         </div>
//       )}

//       <label className="flex items-center gap-2 mt-3">
//         <input
//           type="checkbox"
//           checked={finalPaymentReceived}
//           onChange={(e) => onFinalPaymentReceivedChange(e.target.checked)}
//         />
//         Final Payment Received
//       </label>

//       {finalPaymentReceived && (
//         <select
//           className="border rounded p-2 w-full"
//           value={finalPaymentMode}
//           onChange={(e) => onFinalPaymentModeChange(e.target.value)}
//         >
//           <option value="CASH">Cash</option>
//           <option value="UPI">UPI</option>
//           <option value="CARD">Card</option>
//           <option value="ONLINE">Online</option>
//           <option value="BANK_TRANSFER">Bank Transfer</option>
//         </select>
//       )}
//     </div>
//   );
// }


import { toast } from "sonner";
import { updateRoomBillingApi } from "@/api/bookingApi";
import { Booking, BillingData } from "../BookingDetails.types";
import { fmt } from "../utils/formatters";

interface BillingSummarySectionProps {
  booking: Booking;
  billingData: BillingData | null;
  totalAdvance: number;
  finalPaymentReceived: boolean;
  finalPaymentMode: string;
  onFinalPaymentReceivedChange: (received: boolean) => void;
  onFinalPaymentModeChange: (mode: string) => void;
  onRefresh: () => void;
}

export function BillingSummarySection({
  booking,
  billingData,
  finalPaymentReceived,
  finalPaymentMode,
  onFinalPaymentReceivedChange,
  onFinalPaymentModeChange,
  onRefresh,
}: BillingSummarySectionProps) {
  if (!booking || !billingData) return null;

  return (
    <div className="rounded-xl border border-primary/40 bg-background shadow-sm overflow-hidden">
      
      {/* ===== HEADER ===== */}
      <div className="px-4 py-3 bg-primary/10 border-b border-primary/40">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-primary">
          Billing Summary
        </h3>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="p-4 space-y-4 text-sm">
        
        {/* Grand Total */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Grand Total</span>
          <span className="font-semibold text-base">
            ₹{fmt(billingData.grandTotal)}
          </span>
        </div>

        {/* Advance Paid */}
        <div className="flex justify-between items-center text-erp-success">
          <span>Advance Paid</span>
          <span className="font-medium">
            ₹{fmt(booking.advancePaid)}
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-primary/30" />

        {/* Balance Due */}
        <div className="flex justify-between items-center">
          <span className="font-semibold">Balance Due</span>
          <span
            className={`text-lg font-bold ${
              finalPaymentReceived
                ? "text-erp-success"
                : "text-erp-warning"
            }`}
          >
            ₹{fmt(finalPaymentReceived ? 0 : booking.balanceDue)}
          </span>
        </div>

        {/* ===== ROUND OFF ===== */}
        <div className="flex items-center justify-between pt-2">
          <label className="text-xs font-medium text-muted-foreground">
            Enable Round Off
          </label>
          <input
            type="checkbox"
            checked={booking.roundOffEnabled}
            onChange={async (e) => {
              try {
                await updateRoomBillingApi(booking._id, {
                  discount: booking.discount,
                  gstEnabled: booking.gstEnabled,
                  roundOffEnabled: e.target.checked,
                });
                toast.success("Billing updated");
                onRefresh();
              } catch {
                toast.error("Failed to update billing");
              }
            }}
          />
        </div>

        {booking.roundOffEnabled && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Round Off Adjustment</span>
            <span>₹{booking.roundOffAmount || 0}</span>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-primary/30" />

        {/* ===== FINAL PAYMENT ===== */}
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={finalPaymentReceived}
            onChange={(e) => onFinalPaymentReceivedChange(e.target.checked)}
          />
          Final Payment Received
        </label>

        {finalPaymentReceived && (
          <select
            className="w-full mt-2 rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={finalPaymentMode}
            onChange={(e) => onFinalPaymentModeChange(e.target.value)}
          >
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="ONLINE">Online</option>
            <option value="BANK TRANSFER">Bank Transfer</option>
          </select>
        )}
      </div>
    </div>
  );
}

/*old ui */

// import { toast } from "sonner";
// import { updateRoomBillingApi } from "@/api/bookingApi";
// import { Booking, BillingData } from "../BookingDetails.types";
// import { fmt } from "../utils/formatters";

// interface BillingSummarySectionProps {
//   booking: Booking;
//   billingData: BillingData | null;
//   totalAdvance: number;
//   finalPaymentReceived: boolean;
//   finalPaymentMode: string;
//   onFinalPaymentReceivedChange: (received: boolean) => void;
//   onFinalPaymentModeChange: (mode: string) => void;
//   onRefresh: () => void;
// }

// export function BillingSummarySection({
//   booking,
//   billingData,
//   finalPaymentReceived,
//   finalPaymentMode,
//   onFinalPaymentReceivedChange,
//   onFinalPaymentModeChange,
//   onRefresh,
// }: BillingSummarySectionProps) {
//   if (!booking || !billingData) return null;

//   return (
//     <div className="border rounded-md p-4 bg-secondary/30 space-y-3">
//       <div className="flex justify-between font-medium">
//         <span>Grand Total</span>
//         <span>₹{fmt(billingData.grandTotal)}</span>
//       </div>

//       <div className="flex justify-between text-success">
//         <span>Advance Paid ( Room )</span>
//         <span>₹{fmt(booking.advancePaid)}</span>
//       </div>

//       <div className="flex justify-between font-bold text-lg border-t pt-2">
//         <span>Balance Due</span>
//         <span className="text-warning">
//           ₹{fmt(finalPaymentReceived ? 0 : booking.balanceDue)}
//         </span>
//       </div>

//       <div className="flex justify-between items-center">
//         <label className="font-medium">Round Off Total</label>
//         <input
//           type="checkbox"
//           checked={booking.roundOffEnabled}
//           onChange={async (e) => {
//             await updateRoomBillingApi(booking._id, {
//               discount: booking.discount,
//               gstEnabled: booking.gstEnabled,
//               roundOffEnabled: e.target.checked,
//             });
//             onRefresh();
//           }}
//         />
//       </div>

//       {booking.roundOffEnabled && (
//         <div className="flex justify-between text-sm text-muted-foreground">
//           <span>Round Off Adjustment</span>
//           <span>₹{booking.roundOffAmount || 0}</span>
//         </div>
//       )}

//       <label className="flex items-center gap-2 mt-3">
//         <input
//           type="checkbox"
//           checked={finalPaymentReceived}
//           onChange={(e) => onFinalPaymentReceivedChange(e.target.checked)}
//         />
//         Final Payment Received
//       </label>

//       {finalPaymentReceived && (
//         <select
//           className="border rounded p-2 w-full"
//           value={finalPaymentMode}
//           onChange={(e) => onFinalPaymentModeChange(e.target.value)}
//         >
//           <option value="CASH">Cash</option>
//           <option value="UPI">UPI</option>
//           <option value="CARD">Card</option>
//           <option value="ONLINE">Online</option>
//           <option value="BANK_TRANSFER">Bank Transfer</option>
//         </select>
//       )}
//     </div>
//   );
// }


