import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";

interface ExtraService {
  name: string;
  price: string;
  days: number[];
  gstEnabled: boolean;
}

interface ExtraServicesSectionProps {
  services: ExtraService[];
  nights: number;
  onChange: (services: ExtraService[]) => void;
}

export function ExtraServicesSection({
  services,
  nights,
  onChange,
}: ExtraServicesSectionProps) {
  const addService = () => {
    onChange([
      ...services,
      {
        name: "",
        price: "",
        days: Array.from({ length: nights }, (_, i) => i + 1),
        gstEnabled: true,
      },
    ]);
  };

  const updateService = (index: number, updates: Partial<ExtraService>) => {
    const updated = [...services];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeService = (index: number) => {
    onChange(services.filter((_, i) => i !== index));
  };

  const toggleDay = (serviceIndex: number, day: number) => {
    const service = services[serviceIndex];
    const newDays = service.days.includes(day)
      ? service.days.filter((d) => d !== day)
      : [...service.days, day].sort((a, b) => a - b);
    updateService(serviceIndex, { days: newDays });
  };

  const selectAllDays = (index: number) => {
    updateService(index, {
      days: Array.from({ length: nights }, (_, i) => i + 1),
    });
  };

  const clearAllDays = (index: number) => {
    updateService(index, { days: [] });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-4">
      {/* EMPTY STATE */}
      {services.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md bg-muted/20">
          No extra services added
        </div>
      )}

      {services.map((service, idx) => {
        const activeDays = service.days.length || nights;
        const serviceTotal = Number(service.price || 0) * activeDays;

        return (
          <div
            key={idx}
            className="border rounded-xl p-4 bg-background shadow-sm space-y-4"
          >
            {/* HEADER */}
            <div className="flex items-start gap-3">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="erp-field">
                  <Label className="erp-label">Service Name</Label>
                  <Input
                    className="h-9"
                    placeholder="e.g. Laundry, Airport Pickup"
                    value={service.name}
                    onChange={(e) =>
                      updateService(idx, { name: e.target.value })
                    }
                  />
                </div>

                <div className="erp-field">
                  <Label className="erp-label">Price per Day (₹)</Label>
                  <Input
                    className="h-9"
                    type="number"
                    placeholder="0"
                    value={service.price}
                    onChange={(e) =>
                      updateService(idx, { price: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* DELETE */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive hover:bg-destructive/10 mt-6"
                onClick={() => removeService(idx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* GST + TOTAL */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-wrap">
                {/* GST TOGGLE */}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={service.gstEnabled}
                    onCheckedChange={(checked) =>
                      updateService(idx, { gstEnabled: checked })
                    }
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    GST {service.gstEnabled ? "Applied" : "Not Applied"}
                  </span>
                </div>

                {/* CALCULATION */}
                <span className="text-xs text-muted-foreground">
                  {activeDays} day(s) ×{" "}
                  {formatCurrency(Number(service.price || 0))} ={" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(serviceTotal)}
                  </span>
                </span>
              </div>
            </div>

            {/* DAY SELECTION */}
            {nights > 1 && (
              <div className="pt-3 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Service Days ({service.days.length}/{nights})
                  </span>

                  {/* VISIBLE ERP ACTION BUTTONS */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => selectAllDays(idx)}
                      className="transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
                    >
                      ✓ All Days
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => clearAllDays(idx)}
                      className="transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
                    >
                      ✕ Clear
                    </Button>
                  </div>
                </div>

                {/* DAY CHIPS */}
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: nights }).map((_, i) => {
                    const day = i + 1;
                    const isActive = service.days.includes(day);

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(idx, day)}
                        className={`px-3 py-1.5 text-xs rounded-md border transition
                          ${
                            isActive
                              ? "bg-primary text-white border-primary"
                              : "bg-transparent border-dashed text-muted-foreground hover:border-primary/50"
                          }`}
                      >
                        Day {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ADD SERVICE */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addService}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Extra Service
      </Button>
    </div>
  );
}
