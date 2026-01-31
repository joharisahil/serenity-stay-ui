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

export default function PlanSelectionCard({
  plans,
  form,
  setForm,
  selectedPlan,
  setSelectedPlan,
}: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Selection</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-4">
        <Select
          value={form.planId}
          onValueChange={id => {
            const p = plans.find((x: any) => x._id === id) || null;
            setSelectedPlan(p);
            setForm({ ...form, planId: id });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map((p: any) => (
              <SelectItem key={p._id} value={p._id}>
                {p.name} – ₹{p.ratePerPerson}/person
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedPlan && (
          <div className="text-sm font-medium">
            Estimated Food: ₹
            {selectedPlan.ratePerPerson * form.guestsCount}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
