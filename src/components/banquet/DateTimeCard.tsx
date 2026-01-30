import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function DateTimeCard({ form, setForm }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Date & Time</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-4">
        <Input
          type="date"
          value={form.eventDate}
          onChange={e => setForm({ ...form, eventDate: e.target.value })}
        />
        <Input
          type="time"
          value={form.startTime}
          onChange={e => setForm({ ...form, startTime: e.target.value })}
        />
        <Input
          type="time"
          value={form.endTime}
          onChange={e => setForm({ ...form, endTime: e.target.value })}
        />
      </CardContent>
    </Card>
  );
}
