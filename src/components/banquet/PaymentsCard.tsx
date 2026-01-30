import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export default function PaymentsCard({ payments, setPayments }: any) {

  /* ✅ FIX: default mode = CASH */
  const addPayment = () =>
    setPayments([
      ...payments,
      {
        type: "ADVANCE",
        amount: 0,
        mode: "CASH",     // 🔥 IMPORTANT
        date: "",
      },
    ]);

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <CardTitle>Advance Payments</CardTitle>
        <Button size="sm" onClick={addPayment}>
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {payments.map((p: any, i: number) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-center">

            {/* AMOUNT */}
            <Input
              type="number"
              placeholder="Amount"
              value={p.amount}
              onChange={e => {
                const c = [...payments];
                c[i].amount = Number(e.target.value);
                setPayments(c);
              }}
            />

            {/* MODE */}
            <Select
              value={p.mode || "CASH"}   // 🔥 fallback
              onValueChange={v => {
                const c = [...payments];
                c[i].mode = v;
                setPayments(c);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="BANK">Bank</SelectItem>
              </SelectContent>
            </Select>

            {/* DATE */}
            <Input
              type="date"
              value={p.date}
              onChange={e => {
                const c = [...payments];
                c[i].date = e.target.value;
                setPayments(c);
              }}
            />

            {/* DELETE */}
            <Button
              size="icon"
              variant="destructive"
              onClick={() =>
                setPayments(payments.filter((_: any, idx: number) => idx !== i))
              }
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
