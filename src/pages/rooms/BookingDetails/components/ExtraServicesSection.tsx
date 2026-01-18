import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Booking } from "../BookingDetails.types";
import { fmt } from "../utils/formatters";
import { updateBookingServicesApi } from "@/api/bookingApi";
import { getNights } from "../utils/getNights";

interface ExtraServicesSectionProps {
  booking: Booking;
  onRefresh: () => void;
}

export function ExtraServicesSection({
  booking,
  onRefresh,
}: ExtraServicesSectionProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [servicesForm, setServicesForm] = useState<any[]>(
    JSON.parse(JSON.stringify(booking.addedServices || []))
  );

  const nights = getNights(booking.checkIn, booking.checkOut);

  const GST_RATE = 0.05;

  /* ================= SAME LOGIC (UNCHANGED) ================= */
  const calcServiceTotal = (s: any) => {
    const days =
      Array.isArray(s.days) && s.days.length > 0 ? s.days.length : nights;

    const base = (s.price || 0) * days;
    const gst = s.gstEnabled ? base * GST_RATE : 0;

    return {
      base,
      cgst: gst / 2,
      sgst: gst / 2,
      total: base + gst,
      days,
    };
  };

  const extras = booking.addedServices || [];

  return (
    <>
      {/* ================= SUMMARY ================= */}
      <details className="border rounded-md p-4 bg-secondary/20">
        <summary className="cursor-pointer font-semibold text-lg">
          Extra Services
        </summary>

        <div className="mt-4 space-y-3">
          {extras.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No extra services added
            </p>
          )}

          {extras.map((s, i) => {
            const c = calcServiceTotal(s);

            return (
              <div
                key={i}
                className="border rounded-md p-3 bg-background space-y-1 text-sm"
              >
                <div className="flex justify-between font-medium">
                  <span>
                    {s.name}
                    <span className="text-muted-foreground">
                      {" "}
                      ({c.days} day{c.days > 1 ? "s" : ""})
                    </span>
                  </span>
                  <span>₹{fmt(c.base)}</span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>GST Applied</span>
                  <span>{s.gstEnabled ? "Yes (5%)" : "No"}</span>
                </div>

                {s.gstEnabled && (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>CGST (2.5%)</span>
                      <span>₹{fmt(c.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>SGST (2.5%)</span>
                      <span>₹{fmt(c.sgst)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Service Total</span>
                  <span>₹{fmt(c.total)}</span>
                </div>
              </div>
            );
          })}

          <div className="pt-4 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setServicesForm(
                  JSON.parse(JSON.stringify(booking.addedServices || []))
                );
                setEditOpen(true);
              }}
            >
              Edit Services
            </Button>
          </div>
        </div>
      </details>

      {/* ================= EDIT DIALOG (CLEAN VERSION) ================= */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Extra Services</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto">
            {servicesForm.map((s, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3">
                {/* Service name + delete */}
                <div className="flex gap-3 items-center">
                  <Input
                    placeholder="Service name"
                    value={s.name}
                    onChange={(e) => {
                      const copy = [...servicesForm];
                      copy[idx].name = e.target.value;
                      setServicesForm(copy);
                    }}
                  />

                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setServicesForm((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Price + GST */}
                <div className="flex gap-4 items-center">
                  <Input
                    type="number"
                    placeholder="Price"
                    value={s.price}
                    className="flex h-8 w-48 rounded-md border border-input bg-background px-2 py-1 text-sm"
                    onChange={(e) => {
                      const copy = [...servicesForm];
                      copy[idx].price = Number(e.target.value);
                      setServicesForm(copy);
                    }}
                  />

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={s.gstEnabled !== false}
                      onChange={(e) => {
                        const copy = [...servicesForm];
                        copy[idx].gstEnabled = e.target.checked;
                        setServicesForm(copy);
                      }}
                    />
                    Apply GST (5%)
                  </label>
                </div>

                {/* Applicable Days */}
                <div>
                  <p className="text-sm font-medium mb-1">Applicable Days</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: nights }, (_, d) => d + 1).map(
                      (day) => (
                        <label
                          key={day}
                          className="flex items-center gap-1 text-xs border px-2 py-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={s.days?.includes(day)}
                            onChange={(e) => {
                              const copy = [...servicesForm];
                              const setDays = new Set(copy[idx].days || []);
                              e.target.checked
                                ? setDays.add(day)
                                : setDays.delete(day);
                              copy[idx].days = Array.from(setDays);
                              setServicesForm(copy);
                            }}
                          />
                          Day {day}
                        </label>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() =>
                setServicesForm((prev) => [
                  ...prev,
                  { name: "", price: 0, days: [], gstEnabled: true },
                ])
              }
            >
              + Add Service
            </Button>

            <Button
              onClick={async () => {
                try {
                  await updateBookingServicesApi(booking._id, servicesForm);
                  toast.success("Extra services updated");
                  setEditOpen(false);
                  onRefresh();
                } catch {
                  toast.error("Failed to update services");
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
