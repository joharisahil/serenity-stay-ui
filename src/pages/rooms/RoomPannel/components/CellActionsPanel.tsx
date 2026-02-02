import { Plus, CalendarPlus, Ban, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface CellActionsPanelProps {
  roomId: string;
  roomNumber: string;
  date: string;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

export function CellActionsPanel({
  roomId,
  roomNumber,
  date,
  isOpen,
  onClose,
  onAction,
}: CellActionsPanelProps) {
  if (!isOpen) return null;

  const formattedDate = format(parseISO(date), "EEE, MMM d, yyyy");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-sm bg-panel border-l shadow-panel z-50",
          "animate-slide-in-right"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-semibold">Quick Actions</h2>
              <p className="text-sm text-muted-foreground">
                Room {roomNumber} • {formattedDate}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex-1 p-4 space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Choose an action for this room and date:
            </p>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => onAction("new-booking")}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarPlus className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Create Booking</div>
                  <div className="text-sm text-muted-foreground">
                    Reserve room for a guest
                  </div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => onAction("walk-in")}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-source-walkin/10 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-source-walkin" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Walk-in Check-in</div>
                  <div className="text-sm text-muted-foreground">
                    Guest at reception now
                  </div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => onAction("block")}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-room-blocked/10 flex items-center justify-center">
                  <Ban className="h-5 w-5 text-room-blocked" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Block Room</div>
                  <div className="text-sm text-muted-foreground">
                    OTA, Banquet, or Maintenance
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
