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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateGuestInfoApi,
  updateGuestIdsApi,
  updateCompanyDetailsApi,
} from "@/api/bookingApi";
import { Booking } from "../BookingDetails.types";
import { readablePlan } from "../utils/formatters";

interface GuestInfoSectionProps {
  booking: Booking;
  onRefresh: () => void;
}

export function GuestInfoSection({
  booking,
  onRefresh,
}: GuestInfoSectionProps) {
  const [editGuestOpen, setEditGuestOpen] = useState(false);
  const [editGuestIdsOpen, setEditGuestIdsOpen] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);

  const [guestForm, setGuestForm] = useState<any>({});
  const [guestIdsForm, setGuestIdsForm] = useState<any[]>([]);
  const [companyForm, setCompanyForm] = useState<any>({});

  return (
    <>
      {/* ===================== GUEST INFO ===================== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Guest Information</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setGuestForm({
                guestName: booking.guestName,
                guestPhone: booking.guestPhone,
                guestCity: booking.guestCity,
                guestNationality: booking.guestNationality,
                guestAddress: booking.guestAddress,
                adults: booking.adults,
                children: booking.children,
              });
              setEditGuestOpen(true);
            }}
          >
            Edit
          </Button>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p>
            <strong>Name:</strong> {booking.guestName}
          </p>
          <p>
            <strong>Phone:</strong> {booking.guestPhone}
          </p>
          <p>
            <strong>City:</strong> {booking.guestCity || "—"}
          </p>
          <p>
            <strong>Nationality:</strong> {booking.guestNationality || "—"}
          </p>
          <p>
            <strong>Adults:</strong> {booking.adults}
          </p>
          <p>
            <strong>Children:</strong> {booking.children}
          </p>
          <p>
            <strong>Plan:</strong> {readablePlan(booking.planCode)}
          </p>

          <div className="md:col-span-2">
            <p>
              <strong>Address:</strong> {booking.guestAddress || "—"}
            </p>
          </div>
          {/* ADVANCE SUMMARY */}
          <div className="md:col-span-2">
            <p>
              <strong>Total Advance Paid:</strong> ₹{booking.advancePaid}
            </p>
          </div>

          {/* ADVANCE TABLE */}
          {booking.advances?.length > 0 && (
            <div className="md:col-span-2">
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-primary/10">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-primary">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-primary">
                          Mode
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-primary">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-primary">
                          Note
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {booking.advances.map((adv, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">
                            {new Date(adv.date).toLocaleDateString()}
                          </td>
                          <td className="p-2">{adv.mode}</td>
                          <td className="p-2 text-right font-medium">
                            ₹{adv.amount}
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {adv.note || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===================== GUEST IDS ===================== */}
      {booking.guestIds?.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Guest ID Proofs</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setGuestIdsForm(booking.guestIds || []);
                setEditGuestIdsOpen(true);
              }}
            >
              Edit
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {booking.guestIds.map((id, idx) => (
              <div key={idx} className="border p-3 rounded-md bg-secondary/30">
                <p>
                  <strong>ID Type:</strong> {id.type}
                </p>
                <p>
                  <strong>ID Number:</strong> {id.idNumber}
                </p>
                <p>
                  <strong>Name on ID:</strong> {id.nameOnId}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ===================== COMPANY DETAILS ===================== */}
      {(booking.companyName || booking.companyGSTIN) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Company / GST Details</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCompanyForm({
                  companyName: booking.companyName,
                  companyGSTIN: booking.companyGSTIN,
                  companyAddress: booking.companyAddress,
                });
                setEditCompanyOpen(true);
              }}
            >
              Edit
            </Button>
          </CardHeader>

          <CardContent className="space-y-2">
            <p>
              <strong>Company Name:</strong> {booking.companyName || "—"}
            </p>
            <p>
              <strong>GSTIN:</strong> {booking.companyGSTIN || "—"}
            </p>
            <p>
              <strong>Company Address:</strong> {booking.companyAddress || "—"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ===================== EDIT GUEST DIALOG ===================== */}
      <Dialog open={editGuestOpen} onOpenChange={setEditGuestOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Guest Information</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Guest Name</label>
              <Input
                value={guestForm.guestName || ""}
                onChange={(e) =>
                  setGuestForm({ ...guestForm, guestName: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={guestForm.guestPhone || ""}
                onChange={(e) =>
                  setGuestForm({ ...guestForm, guestPhone: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">City</label>
              <Input
                value={guestForm.guestCity || ""}
                onChange={(e) =>
                  setGuestForm({ ...guestForm, guestCity: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Nationality</label>
              <Input
                value={guestForm.guestNationality || ""}
                onChange={(e) =>
                  setGuestForm({
                    ...guestForm,
                    guestNationality: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Adults</label>
              <Input
                type="number"
                value={guestForm.adults ?? ""}
                onChange={(e) =>
                  setGuestForm({ ...guestForm, adults: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Children</label>
              <Input
                type="number"
                value={guestForm.children ?? ""}
                onChange={(e) =>
                  setGuestForm({
                    ...guestForm,
                    children: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-1 mt-4">
            <label className="text-sm font-medium">Address</label>
            <Input
              value={guestForm.guestAddress || ""}
              onChange={(e) =>
                setGuestForm({ ...guestForm, guestAddress: e.target.value })
              }
            />
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditGuestOpen(false)}>
              Cancel
            </Button>

            <Button
              onClick={async () => {
                try {
                  await updateGuestInfoApi(booking._id, guestForm);
                  toast.success("Guest information updated");
                  onRefresh();
                  setEditGuestOpen(false);
                } catch {
                  toast.error("Failed to update guest information");
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== EDIT GUEST IDS DIALOG ===================== */}
      <Dialog open={editGuestIdsOpen} onOpenChange={setEditGuestIdsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Guest ID Proofs</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {guestIdsForm.map((id, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-3 rounded-lg"
              >
                {/* ID TYPE */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">ID Type</label>
                  <select
                    value={id.type}
                    onChange={(e) => {
                      const copy = [...guestIdsForm];
                      copy[idx].type = e.target.value;
                      setGuestIdsForm(copy);
                    }}
                    className="border rounded p-2 w-full"
                  >
                    <option value="">Select ID</option>
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Passport">Passport</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>

                {/* ID NUMBER */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">ID Number</label>
                  <Input
                    value={id.idNumber}
                    onChange={(e) => {
                      const copy = [...guestIdsForm];
                      copy[idx].idNumber = e.target.value;
                      setGuestIdsForm(copy);
                    }}
                  />
                </div>

                {/* NAME ON ID + DELETE */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Name on ID</label>
                  <div className="flex gap-2">
                    <Input
                      value={id.nameOnId}
                      onChange={(e) => {
                        const copy = [...guestIdsForm];
                        copy[idx].nameOnId = e.target.value;
                        setGuestIdsForm(copy);
                      }}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() =>
                        setGuestIdsForm(
                          guestIdsForm.filter((_, i) => i !== idx)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              onClick={async () => {
                try {
                  await updateGuestIdsApi(booking._id, guestIdsForm);
                  toast.success("Guest IDs updated");
                  onRefresh();
                  setEditGuestIdsOpen(false);
                } catch {
                  toast.error("Failed to update guest IDs");
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== COMPANY DIALOG ===================== */}
      <Dialog open={editCompanyOpen} onOpenChange={setEditCompanyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Company / GST Details</DialogTitle>
          </DialogHeader>
          <label className="text-sm font-medium">Company Name</label>
          <Input
            placeholder="Company Name"
            value={companyForm.companyName || ""}
            onChange={(e) =>
              setCompanyForm({ ...companyForm, companyName: e.target.value })
            }
          />
          <label className="text-sm font-medium">GSTIN</label>
          <Input
            placeholder="GSTIN"
            value={companyForm.companyGSTIN || ""}
            onChange={(e) =>
              setCompanyForm({ ...companyForm, companyGSTIN: e.target.value })
            }
          />
          <label className="text-sm font-medium">Company Address</label>
          <Input
            placeholder="Company Address"
            value={companyForm.companyAddress || ""}
            onChange={(e) =>
              setCompanyForm({ ...companyForm, companyAddress: e.target.value })
            }
          />

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditCompanyOpen(false)}>
              Cancel
            </Button>

            <Button
              onClick={async () => {
                await updateCompanyDetailsApi(booking._id, companyForm);
                toast.success("Company / GST details updated");
                onRefresh();
                setEditCompanyOpen(false);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


