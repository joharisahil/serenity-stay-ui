import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Plus, Wrench, Ban } from "lucide-react";

interface CellActionsPanelProps {
  roomId: string;
  dateStr: string;
  onClose: () => void;
  onCreateBooking: (roomId: string, dateStr: string) => void;
}

export function CellActionsPanel({
  roomId,
  dateStr,
  onClose,
  onCreateBooking,
}: CellActionsPanelProps) {
  return (
    <div className="absolute z-50">
      <Card
        className={cn(
          "w-64 p-3 shadow-xl border",
          "animate-in fade-in zoom-in-95",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-semibold">{dateStr}</div>
            <div className="text-xs text-muted-foreground">Room actions</div>
          </div>

          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-3">
          <Button
            className="justify-start gap-2"
            onClick={() => onCreateBooking(roomId, dateStr)}
          >
            <Plus className="h-4 w-4" />
            Create Booking
          </Button>
        </div>
      </Card>
    </div>
  );
}
