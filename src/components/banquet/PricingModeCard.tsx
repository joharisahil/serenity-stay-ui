import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function PricingModeCard({ form, setForm }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Mode</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-4">
        <Select
          value={form.pricingMode}
          onValueChange={v => setForm({ ...form, pricingMode: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PLAN">Plan</SelectItem>
            <SelectItem value="CUSTOM_FOOD">Custom Food</SelectItem>
            <SelectItem value="HALL_ONLY">Hall Only</SelectItem>
          </SelectContent>
        </Select>

        {form.pricingMode === "CUSTOM_FOOD" && (
          <Input
            type="number"
            placeholder="Custom Food Amount"
            value={form.customFoodAmount}
            onChange={e =>
              setForm({
                ...form,
                customFoodAmount: Number(e.target.value),
              })
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
