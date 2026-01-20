import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Advance } from "../BookingDetails.types";
import { fmt, formatLocal } from "../utils/formatters";

interface AdvancePaymentsSectionProps {
  advances: Advance[];
  totalAdvance: number;

  onAddAdvance: () => void;
  onUpdateAdvance: (index: number, key: string, value: any) => void;

  onDepositAdvance: (index: number) => void;
  onDeleteAdvance: (advanceId: string) => void; // ✅ FIX
}

export function AdvancePaymentsSection({
  advances,
  totalAdvance,
  onAddAdvance,
  onUpdateAdvance,
  onDepositAdvance,
  onDeleteAdvance,
}: AdvancePaymentsSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Advance Payments</CardTitle>
        <Button size="sm" variant="outline" onClick={onAddAdvance}>
          + Add Advance
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {advances.map((adv, idx) => {
          const isSaved = Boolean(adv._id);

          return (
            <div
              key={adv._id || idx}
              className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end border p-3 rounded-lg"
            >
              <Input
                type="number"
                placeholder="Amount"
                value={adv.amount}
                onChange={(e) =>
                  onUpdateAdvance(idx, "amount", Number(e.target.value))
                }
                disabled={isSaved}
              />

              <select
                className="border rounded p-2"
                value={adv.mode}
                disabled={isSaved}
                onChange={(e) => onUpdateAdvance(idx, "mode", e.target.value)}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK">Bank</option>
              </select>

              {isSaved ? (
                <div className="h-10 flex items-center px-3 text-sm text-muted-foreground">
                  {formatLocal(adv.date)}
                </div>
              ) : (
                <Input
                  type="date"
                  value={adv.date || ""}
                  onChange={(e) => onUpdateAdvance(idx, "date", e.target.value)}
                />
              )}

              <Input
                placeholder="Note"
                value={adv.note || ""}
                disabled={isSaved}
                onChange={(e) => onUpdateAdvance(idx, "note", e.target.value)}
              />

              {/* ACTION BUTTON */}
              {isSaved ? (
                <Button
                  variant="destructive"
                  onClick={() => onDeleteAdvance(adv._id!)}
                >
                  Delete Advance
                </Button>
              ) : (
                <Button variant="default" onClick={() => onDepositAdvance(idx)}>
                  Deposit Advance
                </Button>
              )}
            </div>
          );
        })}

        {advances.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No advances added yet.
          </p>
        )}

        <div className="flex justify-between font-semibold border-t pt-2">
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
