import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Advance } from "../BookingDetails.types";
import { fmt } from "../utils/formatters";
import { X } from "lucide-react";

interface AdvancePaymentsSectionProps {
  advances: Advance[];
  totalAdvance: number;

  onAddAdvance: () => void;
  onUpdateAdvance: (index: number, key: string, value: any) => void;

  onDepositAdvance: (index: number) => void;
  onDeleteAdvance: (advanceId: string) => void;
  onCancelAdvance: (index: number) => void;
}

export function AdvancePaymentsSection({
  advances,
  totalAdvance,
  onAddAdvance,
  onUpdateAdvance,
  onDepositAdvance,
  onDeleteAdvance,
  onCancelAdvance,
}: AdvancePaymentsSectionProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Advance Payments</CardTitle>
        <Button size="sm" variant="outline" onClick={onAddAdvance}>
          + Add Advance
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {advances.map((adv, idx) => {
          const isSaved = Boolean(adv._id);

          return (
            <div
              key={adv._id || idx}
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                md:grid-cols-5
                gap-3
                items-center
                border
                rounded-lg
                p-3
              "
            >
              {/* Amount */}
              <Input
                type="number"
                placeholder="Amount"
                value={adv.amount}
                disabled={isSaved}
                inputMode="numeric"
                pattern="[0-9]*"
                className="appearance-none"
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) =>
                  onUpdateAdvance(idx, "amount", Number(e.target.value))
                }
              />

              {/* Mode */}
              <select
                className="h-10 w-full border rounded px-2"
                value={adv.mode}
                disabled={isSaved}
                onChange={(e) =>
                  onUpdateAdvance(idx, "mode", e.target.value)
                }
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK">Bank</option>
              </select>

              {/* Date (NO TIME) */}
              {isSaved ? (
                <div className="text-sm text-muted-foreground">
                  {new Date(adv.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              ) : (
                <Input
                  type="date"
                  value={adv.date}
                  onChange={(e) =>
                    onUpdateAdvance(idx, "date", e.target.value)
                  }
                />
              )}

              {/* Note (RESTORED ✅) */}
              <Input
                placeholder="Note"
                value={adv.note || ""}
                disabled={isSaved}
                onChange={(e) =>
                  onUpdateAdvance(idx, "note", e.target.value)
                }
              />

              {/* Actions */}
              <div className="flex gap-2">
                {isSaved ? (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => onDeleteAdvance(adv._id!)}
                  >
                    Delete
                  </Button>
                ) : (
                  <>
                    <Button
                      className="flex-1"
                      onClick={() => onDepositAdvance(idx)}
                    >
                      Deposit
                    </Button>

                    {/* ❌ Cancel with border */}
                    <button
                      type="button"
                      onClick={() => onCancelAdvance(idx)}
                      className="
                        h-10 w-10
                        flex items-center justify-center
                        rounded-md
                        border
                        border-border
                        text-muted-foreground
                        hover:border-destructive
                        hover:text-destructive
                        transition
                      "
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {advances.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No advances added yet.
          </p>
        )}

        <div className="flex justify-between border-t pt-3 font-semibold">
          <span>Total Advance Paid</span>
          <span className="text-success">₹{fmt(totalAdvance)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

//interface AdvancePaymentsSectionProps {
//   advances: Advance[];
//   totalAdvance: number;
//   onAddAdvance: () => void;
//   onUpdateAdvance: (index: number, key: string, value: any) => void;
//   onRemoveAdvance: (index: number) => void;
// }

// export function AdvancePaymentsSection({
//   advances,
//   totalAdvance,
//   onAddAdvance,
//   onUpdateAdvance,
//   onRemoveAdvance,
// }: AdvancePaymentsSectionProps) {
//   return (
//     <Card>
//       <CardHeader className="flex justify-between items-center">
//         <CardTitle>Advance Payments</CardTitle>
//         <Button size="sm" variant="outline" onClick={onAddAdvance}>
//           + Add Advance
//         </Button>
//       </CardHeader>

//       <CardContent className="space-y-4">
//         {advances.map((adv, idx) => (
//           <div
//             key={idx}
//             className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end border p-3 rounded-lg"
//           >
//             <Input
//               type="number"
//               placeholder="Amount"
//               value={adv.amount}
//               onChange={(e) =>
//                 onUpdateAdvance(idx, "amount", Number(e.target.value))
//               }
//             />

//             <select
//               className="border rounded p-2"
//               value={adv.mode}
//               onChange={(e) => onUpdateAdvance(idx, "mode", e.target.value)}
//             >
//               <option value="CASH">Cash</option>
//               <option value="UPI">UPI</option>
//               <option value="CARD">Card</option>
//               <option value="BANK">Bank</option>
//             </select>

//             <Input
//               type="date"
//               value={adv.date}
//               onChange={(e) => onUpdateAdvance(idx, "date", e.target.value)}
//             />

//             <Input
//               placeholder="Note"
//               value={adv.note || ""}
//               onChange={(e) => onUpdateAdvance(idx, "note", e.target.value)}
//             />

//             <Button
//               size="icon"
//               variant="destructive"
//               onClick={() => onRemoveAdvance(idx)}
//             >
//               ✕
//             </Button>
//           </div>
//         ))}

//         {advances.length === 0 && (
//           <p className="text-muted-foreground text-sm">No advances added yet.</p>
//         )}

//         <div className="flex justify-between font-semibold border-t pt-2">
//           <span>Total Advance Paid</span>
//           <span className="text-success">₹{fmt(totalAdvance)}</span>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
