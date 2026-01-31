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

export default function ServicesCard({ services, setServices }: any) {
  const addService = () =>
    setServices([...services, { name: "", amount: 0, chargeable: true }]);

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <CardTitle>Services</CardTitle>
        <Button size="sm" onClick={addService}>
          <Plus /> Add
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {services.map((s: any, i: number) => (
          <div key={i} className="grid grid-cols-4 gap-2">
            <Input
              placeholder="Service"
              value={s.name}
              onChange={e => {
                const c = [...services];
                c[i].name = e.target.value;
                setServices(c);
              }}
            />
            <Input
              type="number"
              placeholder="Amount"
              value={s.amount}
              onChange={e => {
                const c = [...services];
                c[i].amount = Number(e.target.value);
                setServices(c);
              }}
            />
            <Select
              value={s.chargeable ? "yes" : "no"}
              onValueChange={v => {
                const c = [...services];
                c[i].chargeable = v === "yes";
                setServices(c);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Chargeable</SelectItem>
                <SelectItem value="no">Complimentary</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="destructive"
              onClick={() =>
                setServices(services.filter((_: any, idx: number) => idx !== i))
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
