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
import { Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateGuestInfoApi,
  updateGuestIdsApi,
  updateCompanyDetailsApi,
} from "@/api/bookingApi";
import { Booking } from "../BookingDetails.types";
import { readablePlan } from "../utils/formatters";
import {
  validatePhoneNumber,
  validateRequired,
  validateGSTIN,
  validateDocumentType,
  validateDocumentNumber,
  toUppercaseValue,
} from "@/validators/validator";

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
  type FieldStatus = "idle" | "invalid" | "valid";

  const [phoneStatus, setPhoneStatus] = useState<FieldStatus>("idle");
  const [gstStatus, setGstStatus] = useState<FieldStatus>("idle");

  const ID_TYPE_API_TO_UI: Record<string, string> = {
    "AADHAAR CARD": "Aadhaar Card",
    "DRIVING LICENSE": "Driving License",
    PASSPORT: "Passport",
    "VOTER ID": "Voter ID",
    "PAN CARD": "PAN Card",
  };

  const ID_TYPE_UI_TO_API: Record<string, string> = {
    "Aadhaar Card": "AADHAAR CARD",
    "Driving License": "DRIVING LICENSE",
    Passport: "PASSPORT",
    "Voter ID": "VOTER ID",
    "PAN Card": "PAN CARD",
  };

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
              const phone = booking.guestPhone;
              setGuestForm({
                guestName: booking.guestName,
                guestPhone: booking.guestPhone,
                guestCity: booking.guestCity,
                guestNationality: booking.guestNationality,
                guestAddress: booking.guestAddress,
                adults: booking.adults,
                children: booking.children,
              });
              if (phone && validatePhoneNumber(phone)) {
                setPhoneStatus("valid");
              } else {
                setPhoneStatus("idle");
              }
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
                setGuestIdsForm(
                  (booking.guestIds || []).map((id) => ({
                    ...id,
                    type: ID_TYPE_API_TO_UI[id.type] ?? "",
                  })),
                );

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
      <Dialog
        open={editGuestOpen}
        onOpenChange={(open) => {
          setEditGuestOpen(open);

          // reset validation state when dialog closes
          if (!open) {
            setPhoneStatus("idle");
          }
        }}
      >
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
                  setGuestForm({
                    ...guestForm,
                    guestName: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>

            <div className="space-y-1">
              {/* Invisible label to match layout */}
              <label className="text-sm font-medium ">Phone</label>

              <div className="relative">
                <Input
                  value={guestForm.guestPhone || ""}
                  className={`pr-10 ${
                    phoneStatus === "invalid"
                      ? "border-red-500 focus-visible:ring-red-500"
                      : phoneStatus === "valid"
                        ? "border-green-500 focus-visible:ring-0"
                        : ""
                  }`}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setGuestForm({ ...guestForm, guestPhone: value });
                    setPhoneStatus("idle");
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      setPhoneStatus("idle");
                    } else if (validatePhoneNumber(e.target.value)) {
                      setPhoneStatus("valid");
                    } else {
                      setPhoneStatus("invalid");
                    }
                  }}
                />

                {phoneStatus === "invalid" && (
                  <div className="absolute right-3 inset-y-0 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}

                {phoneStatus === "valid" && (
                  <div className="absolute right-3 inset-y-0 flex items-center pointer-events-none">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>

              {phoneStatus === "invalid" && (
                <p className="text-xs text-red-500">
                  Enter valid 10-digit mobile number
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">City</label>
              <Input
                value={guestForm.guestCity || ""}
                onChange={(e) =>
                  setGuestForm({
                    ...guestForm,
                    guestCity: e.target.value.toUpperCase(),
                  })
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
                    guestNationality: e.target.value.toUpperCase(),
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
                setGuestForm({
                  ...guestForm,
                  guestAddress: e.target.value.toUpperCase(),
                })
              }
            />
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditGuestOpen(false)}>
              Cancel
            </Button>

            <Button
              onClick={async () => {
                if (phoneStatus !== "valid") {
                  toast.error("Please enter a valid phone number");
                  return;
                }

                await updateGuestInfoApi(booking._id, guestForm);
                toast.success("Guest information updated");
                onRefresh();
                setEditGuestOpen(false);
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
                          guestIdsForm.filter((_, i) => i !== idx),
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
                  await updateGuestIdsApi(
                    booking._id,
                    guestIdsForm.map((id) => ({
                      ...id,
                      type: ID_TYPE_UI_TO_API[id.type],
                    })),
                  );

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
      <Dialog
        open={editCompanyOpen}
        onOpenChange={(open) => {
          setEditCompanyOpen(open);
          if (!open) {
            setGstStatus("idle");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Company / GST Details</DialogTitle>
          </DialogHeader>
          <label className="text-sm font-medium">Company Name</label>
          <Input
            placeholder="Company Name"
            value={companyForm.companyName || ""}
            onChange={(e) =>
              setCompanyForm({
                ...companyForm,
                companyName: e.target.value.toUpperCase(),
              })
            }
          />
          <label className="text-sm font-medium">GSTIN</label>
          <div className="space-y-1">
            <div className="relative">
              <Input
                placeholder="GSTIN"
                value={companyForm.companyGSTIN || ""}
                className={`pr-10 ${
                  gstStatus === "invalid"
                    ? "border-red-500 focus-visible:ring-red-500"
                    : gstStatus === "valid"
                      ? "border-green-500 focus-visible:ring-green-500"
                      : ""
                }`}
                onChange={(e) => {
                  setCompanyForm({
                    ...companyForm,
                    companyGSTIN: e.target.value,
                  });
                  setGstStatus("idle");
                }}
                onBlur={(e) => {
                  if (!e.target.value) {
                    setGstStatus("idle");
                  } else if (validateGSTIN(e.target.value)) {
                    setGstStatus("valid");
                  } else {
                    setGstStatus("invalid");
                  }
                }}
              />

              {gstStatus === "invalid" && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
              )}

              {gstStatus === "valid" && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
              )}
            </div>

            {gstStatus === "invalid" && (
              <p className="text-xs text-red-500">Invalid GSTIN format</p>
            )}
          </div>

          <label className="text-sm font-medium">Company Address</label>
          <Input
            placeholder="Company Address"
            value={companyForm.companyAddress || ""}
            onChange={(e) =>
              setCompanyForm({
                ...companyForm,
                companyAddress: e.target.value.toUpperCase(),
              })
            }
          />

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditCompanyOpen(false)}>
              Cancel
            </Button>

            <Button
              onClick={async () => {
                if (gstStatus !== "valid") {
                  toast.error("Please enter valid GSTIN");
                  return;
                }

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
