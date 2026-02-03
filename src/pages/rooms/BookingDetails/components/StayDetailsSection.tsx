import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { reduceStayApi, extendStayApi } from "@/api/bookingApi";
import { Booking, BillingData } from "../BookingDetails.types";
import { formatLocal } from "../utils/formatters";

interface StayDetailsSectionProps {
  booking: Booking;
  billingData: BillingData | null;
  onRefresh: () => void;
}

export function StayDetailsSection({
  booking,
  billingData,
  onRefresh,
}: StayDetailsSectionProps) {
  const [reduceStayOpen, setReduceStayOpen] = useState(false);
  const [reduceCheckOut, setReduceCheckOut] = useState("");
  const [showExtendStay, setShowExtendStay] = useState(false);
  const [newCheckOut, setNewCheckOut] = useState("");

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stay Details</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setReduceCheckOut("");
                setReduceStayOpen(true);
              }}
            >
              Reduce Stay
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowExtendStay(true)}
            >
              Extend Stay
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Check-in:</strong> {formatLocal(booking.checkIn)}
          </p>
          <p>
            <strong>Check-out:</strong> {formatLocal(booking.checkOut)}
          </p>
          <p>
            <strong>Nights:</strong> {billingData?.nights}
          </p>
        </CardContent>
      </Card>

      <Dialog open={reduceStayOpen} onOpenChange={setReduceStayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reduce Stay</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Current checkout: {formatLocal(booking.checkOut)}
          </p>

          <Input
            type="datetime-local"
            value={reduceCheckOut}
            onChange={(e) => setReduceCheckOut(e.target.value)}
          />

          <DialogFooter>
            <Button
              onClick={async () => {
                await reduceStayApi(booking._id, reduceCheckOut);
                toast.success("Stay reduced");
                onRefresh();
                setReduceStayOpen(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExtendStay} onOpenChange={setShowExtendStay}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Stay</DialogTitle>
          </DialogHeader>

          <p>New Checkout Date:</p>
          <Input
            type="datetime-local"
            value={newCheckOut}
            onChange={(e) => setNewCheckOut(e.target.value)}
            className="mt-2"
          />

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowExtendStay(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  const res = await extendStayApi(booking._id, newCheckOut);

                  if (res.warning) {
                    toast.warning(res.message);
                  } else {
                    toast.success("Stay extended successfully");
                  }

                  onRefresh();
                  setShowExtendStay(false);
                } catch (e: any) {
                  if (e?.response?.data?.message) {
                    toast.error(e.response.data.message);
                  } else {
                    toast.error("Failed to extend stay");
                  }
                }
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
