import { Check, DoorOpen, Utensils } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Room {
  _id: string;
  number: string;
  status?: string;
  type?: string;
}

interface Plan {
  key: string;
  label: string;
  price: number;
  meals?: string;
}

interface RoomSelectorProps {
  roomTypes: string[];
  rooms: Room[];
  plans: Plan[];
  selectedRoomType: string;
  selectedRoom: string;
  selectedPlan: string;
  disabled: boolean;
  onRoomTypeChange: (value: string) => void;
  onRoomChange: (value: string) => void;
  onPlanChange: (value: string) => void;

  // ✅ NEW
  isConvertMode?: boolean;
  convertRoom?: {
    number: string;
    type: string;
  };
}

export function RoomSelector({
  roomTypes,
  rooms,
  plans,
  selectedRoomType,
  selectedRoom,
  selectedPlan,
  disabled,
  onRoomTypeChange,
  onRoomChange,
  onPlanChange,
  isConvertMode = false,
  convertRoom,
}: RoomSelectorProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* ============================= */}
      {/* ROOM TYPE */}
      {/* ============================= */}

      <div className="erp-field">
        <Label className="erp-label erp-required">Room Type</Label>

        {isConvertMode ? (
          <div className="erp-input bg-muted flex items-center gap-2">
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
            {convertRoom?.type}
          </div>
        ) : (
          <Select
            disabled={disabled}
            value={selectedRoomType}
            onValueChange={onRoomTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select room type" />
            </SelectTrigger>
            <SelectContent>
              {roomTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <DoorOpen className="h-4 w-4 text-muted-foreground" />
                    {type}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ============================= */}
      {/* ROOM NUMBER */}
      {/* ============================= */}

      <div className="erp-field">
        <Label className="erp-label erp-required">Room Number</Label>

        {isConvertMode ? (
          <div className="erp-input bg-muted flex items-center gap-2">
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
            Room {convertRoom?.number}
          </div>
        ) : (
          <>
            <Select
              disabled={disabled || !selectedRoomType}
              value={selectedRoom}
              onValueChange={onRoomChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room._id} value={room._id}>
                    <div className="flex items-center gap-2">
                      <DoorOpen className="h-4 w-4" />
                      <span className="font-medium">{room.number}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {rooms.length === 0 && selectedRoomType && !disabled && (
              <p className="text-xs text-muted-foreground mt-1">
                No rooms available for selected dates and type
              </p>
            )}
          </>
        )}
      </div>

      {/* ============================= */}
      {/* PLAN SELECTOR */}
      {/* ============================= */}

      <div className="erp-field">
        <Label className="erp-label erp-required">Rate Plan</Label>

        <Select
          disabled={disabled || !selectedRoom}
          value={selectedPlan}
          onValueChange={onPlanChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map((plan) => (
              <SelectItem key={plan.key} value={plan.key}>
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex flex-col">
                    <span className="font-medium">{plan.label}</span>
                    {plan.meals && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Utensils className="h-3 w-3" />
                        {plan.meals}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {formatCurrency(plan.price)}/night
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Plan Badge */}
      {selectedPlan && (
        <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-md border">
          <Check className="h-4 w-4 text-erp-success" />
          <span className="text-sm">
            Plan selected:{" "}
            <strong>
              {plans.find((p) => p.key === selectedPlan)?.label}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
