import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateRoomBillingApi } from "@/api/bookingApi";
import { Booking } from "../BookingDetails.types";
import { fmt } from "../utils/formatters";

interface RoomChargesSectionProps {
  booking: Booking;
  billingData: {
    nights: number;
    roomPrice: number;
    roomStayTotal: number;
    taxable: number;
    cgst: number;
    sgst: number;
  };
  onRefresh: () => void;
}

const reverseGST = (finalAmount: number, gstRate = 5) => {
  const base = +(finalAmount / (1 + gstRate / 100)).toFixed(2);
  return base;
};

export function RoomChargesSection({
  booking,
  billingData,
  onRefresh,
}: RoomChargesSectionProps) {
  const [roomDiscountInput, setRoomDiscountInput] = useState(
    String(booking.discount ?? "")
  );

  /* ===================== NIGHTS ===================== */
  const nights =
    booking.nights ||
    Math.max(
      1,
      Math.ceil(
        (new Date(booking.checkOut).getTime() -
          new Date(booking.checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

  /* ===================== PLAN RATE ===================== */
  const planRate = useMemo(() => {
    const [planCode, occupancy] = String(booking.planCode || "").split("_");
    const plan = booking.room_id?.plans?.find((p) => p.code === planCode);
    if (!plan) return 0;
    return occupancy === "SINGLE" ? plan.singlePrice : plan.doublePrice;
  }, [booking]);

  /* ===================== OFFER LOGIC ===================== */
  const isOfferPricing =
    booking.pricingType === "FINAL_INCLUSIVE" &&
    Number(booking.finalRoomPrice) > 0;

  // 👉 THIS is the key change
  const effectiveRoomRate = isOfferPricing
    ? reverseGST(Number(booking.finalRoomPrice)) // BASE only
    : planRate;

  const roomBaseTotal = effectiveRoomRate * nights;

  /* ===================== ROOM TOTAL (BACKEND TRUTH) ===================== */
  const roomTotal =
    (booking.taxable || 0) + (booking.cgst || 0) + (booking.sgst || 0);

  /* ===================== UI ===================== */
  return (
    <details className="border rounded-md p-4 bg-secondary/20">
      <summary className="cursor-pointer font-semibold text-lg">
        Room Billing
      </summary>

      <div className="mt-4 space-y-4">
        {/* OFFER LABEL */}
        {isOfferPricing && (
          <Badge className="bg-green-600 text-white w-fit">
            Offer Price Applied
          </Badge>
        )}

        {/* ROOM CHARGES */}
        <div className="space-y-1">
          <div className="flex justify-between font-medium">
            <span>{isOfferPricing ? "Offer Price" : "Room Charges"}</span>
            <span>₹{fmt(roomBaseTotal)}</span>
          </div>

          <div className="text-sm text-muted-foreground pl-2">
            {nights} night{nights > 1 ? "s" : ""} × ₹{fmt(effectiveRoomRate)}
          </div>
        </div>

        {/* EXTRA SERVICES */}
        {(booking.addedServices || []).map((s, i) => {
          const days =
            Array.isArray(s.days) && s.days.length > 0 ? s.days.length : nights;

          return (
            <div key={i} className="flex justify-between text-sm pl-2">
              <span>
                {s.name}
                <span className="text-muted-foreground">
                  {" "}
                  ({days} day{days > 1 ? "s" : ""})
                </span>
              </span>
              <span>₹{fmt((s.price || 0) * days)}</span>
            </div>
          );
        })}

        <hr />

        {/* GST */}
        <div className="flex justify-between">
          <span>CGST (2.5%)</span>
          <span>₹{fmt(booking.cgst || 0)}</span>
        </div>

        <div className="flex justify-between">
          <span>SGST (2.5%)</span>
          <span>₹{fmt(booking.sgst || 0)}</span>
        </div>

        {/* DISCOUNT */}
        <div className="flex justify-between text-red-600">
          <span>Room Discount ({booking.discount || 0}%)</span>
          <span>- ₹{fmt(booking.discountAmount || 0)}</span>
        </div>

        {/* ROOM TOTAL */}
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Room Total</span>
          <span>₹{fmt(roomTotal)}</span>
        </div>

        {/* CONTROLS */}
        <div className="mt-4 border-t pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <label className="font-medium">Apply Room GST</label>
            <input
              type="checkbox"
              checked={booking.gstEnabled}
              onChange={async (e) => {
                try {
                  await updateRoomBillingApi(booking._id, {
                    discount: booking.discount,
                    gstEnabled: e.target.checked,
                  });
                  toast.success("Room GST updated");
                  onRefresh();
                } catch {
                  toast.error("Failed to update room GST");
                }
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium">
              Room Discount (%)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={roomDiscountInput}
                onChange={(e) => setRoomDiscountInput(e.target.value)}
              />

              <Button
                disabled={roomDiscountInput === ""}
                onClick={async () => {
                  try {
                    await updateRoomBillingApi(booking._id, {
                      discount: Number(roomDiscountInput),
                      gstEnabled: booking.gstEnabled,
                    });
                    toast.success("Room discount applied");
                    onRefresh();
                  } catch {
                    toast.error("Failed to apply room discount");
                  }
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
