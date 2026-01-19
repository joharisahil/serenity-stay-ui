import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Sparkles } from "lucide-react";

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

export function ExtraServicesSection({ services, nights, onChange }: ExtraServicesSectionProps) {
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
    updateService(index, { days: Array.from({ length: nights }, (_, i) => i + 1) });
  };

  const clearAllDays = (index: number) => {
    updateService(index, { days: [] });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-3">
      {services.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-md">
          No extra services added
        </p>
      )}

      {services.map((service, idx) => {
        const activeDays = service.days.length || nights;
        const serviceTotal = Number(service.price || 0) * activeDays;

        return (
          <div key={idx} className="service-card animate-fade-in">
            {/* Header Row */}
            <div className="flex items-start gap-3">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="erp-field">
                  <Label className="erp-label">Service Name</Label>
                  <Input
                    className="h-9"
                    placeholder="e.g., Laundry, Airport Pickup"
                    value={service.name}
                    onChange={(e) => updateService(idx, { name: e.target.value })}
                  />
                </div>

                <div className="erp-field">
                  <Label className="erp-label">Price per Day (₹)</Label>
                  <Input
                    className="h-9"
                    type="number"
                    placeholder="0"
                    value={service.price}
                    onChange={(e) => updateService(idx, { price: e.target.value })}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 mt-6"
                onClick={() => removeService(idx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* GST Toggle & Days Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateService(idx, { gstEnabled: !service.gstEnabled })}
                  className={`service-gst-badge ${service.gstEnabled ? "service-gst-on" : "service-gst-off"}`}
                >
                  {service.gstEnabled ? "GST Applied" : "No GST"}
                </button>
                <span className="text-xs text-muted-foreground">
                  {activeDays} day(s) × {formatCurrency(Number(service.price || 0))} = {formatCurrency(serviceTotal)}
                </span>
              </div>
            </div>

            {/* Day Selection (only if more than 1 night) */}
            {nights > 1 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Service Days ({service.days.length}/{nights})
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="quick-action"
                      onClick={() => selectAllDays(idx)}
                    >
                      All Days
                    </button>
                    <span className="text-muted-foreground">|</span>
                    <button
                      type="button"
                      className="quick-action"
                      onClick={() => clearAllDays(idx)}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: nights }).map((_, i) => {
                    const day = i + 1;
                    const isActive = service.days.includes(day);

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(idx, day)}
                        className={`day-chip ${isActive ? "day-chip-active" : "day-chip-inactive"}`}
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

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addService}
        className="w-full mt-2"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Extra Service
      </Button>
    </div>
  );
}
