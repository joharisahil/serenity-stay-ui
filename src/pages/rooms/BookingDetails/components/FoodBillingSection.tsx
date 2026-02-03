import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import {
  updateFoodBillingApi,
  getRoomServiceBillForBookingApi,
} from "@/api/bookingApi";

import {
  Booking,
  RoomOrder,
} from "../BookingDetails.types";

import { fmt, formatLocal } from "../utils/formatters";

interface FoodBillingSectionProps {
  booking: Booking;
  roomOrders: RoomOrder[];
  setRoomOrders: (orders: RoomOrder[]) => void;
  roomOrderSummary: any;
  setRoomOrderSummary: (summary: any) => void;
  onRefresh: () => void;
}

export function FoodBillingSection({
  booking,
  roomOrders,
  setRoomOrders,
  roomOrderSummary,
  setRoomOrderSummary,
  onRefresh,
}: FoodBillingSectionProps) {
  const [foodDiscountInput, setFoodDiscountInput] = useState(
    String(booking.foodDiscount ?? "")
  );
console.log("GST from backend:", roomOrderSummary?.gst);
console.log("CGST calc:", (roomOrderSummary?.gst || 0) / 2);


  return (
    <details className="border rounded-md p-4 bg-secondary/20">
      <summary className="cursor-pointer font-semibold text-lg">
        Food Billing
      </summary>

      {/* ================= ORDERS ================= */}
      {roomOrders.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Food / Room Service Orders</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {roomOrders.map((order) => (
              <div
                key={order._id}
                className="border p-3 rounded-md bg-secondary/30 space-y-2"
              >
                <div className="flex justify-between font-medium">
                  <span>Order #{String(order._id).slice(-6)}</span>
                  <span>{formatLocal(order.createdAt)}</span>
                </div>

                <div className="ml-2 space-y-1">
                  {order.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="text-sm flex justify-between"
                    >
                      <span>
                        {it.name} × {it.qty}
                      </span>
                      <span>₹{fmt(it.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ================= TOTALS ================= */}
      <div className="mt-4 space-y-3">
        <div className="flex justify-between">
          <span>Food Subtotal</span>
          <span>₹{fmt(roomOrderSummary?.subtotal || 0)}</span>
        </div>

        <div className="flex justify-between">
          <span>
            Food Discount ({roomOrderSummary?.discountPercent || 0}%)
          </span>
          <span>
            - ₹{fmt(roomOrderSummary?.discountAmount || 0)}
          </span>
        </div>

        <div className="flex justify-between">
          <span>CGST (2.5%)</span>
          <span>
            ₹{fmt((roomOrderSummary?.gst || 0) / 2)}
          </span>
        </div>

        <div className="flex justify-between">
          <span>SGST (2.5%)</span>
          <span>
            ₹{fmt((roomOrderSummary?.gst || 0) / 2)}
          </span>
        </div>

        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Food Total</span>
          <span>₹{fmt(roomOrderSummary?.total || 0)}</span>
        </div>

        {/* ================= CONTROLS ================= */}
        <div className="mt-4 border-t pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <label className="font-medium">Apply Food GST</label>
            <input
              type="checkbox"
              checked={booking.foodGSTEnabled}
              onChange={async (e) => {
                try {
                  await updateFoodBillingApi(booking._id, {
                    foodDiscount: booking.foodDiscount,
                    foodGSTEnabled: e.target.checked,
                  });

                  const foodRes =
                    await getRoomServiceBillForBookingApi(
                      booking._id
                    );

                  setRoomOrders(foodRes.orders || []);
                  setRoomOrderSummary(foodRes.summary || null);

                  toast.success("Food GST updated");
                  onRefresh();
                } catch {
                  toast.error("Failed to update food GST");
                }
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium">
              Food Discount (%)
            </label>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter food discount %"
                value={foodDiscountInput}
                onChange={(e) =>
                  setFoodDiscountInput(e.target.value)
                }
              />

              <Button
                disabled={foodDiscountInput === ""}
                onClick={async () => {
                  try {
                    await updateFoodBillingApi(booking._id, {
                      foodDiscount: Number(foodDiscountInput),
                      foodGSTEnabled: booking.foodGSTEnabled,
                    });

                    const foodRes =
                      await getRoomServiceBillForBookingApi(
                        booking._id
                      );

                    setRoomOrders(foodRes.orders || []);
                    setRoomOrderSummary(foodRes.summary || null);

                    toast.success("Food discount applied");
                    onRefresh();
                  } catch {
                    toast.error("Failed to apply food discount");
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
