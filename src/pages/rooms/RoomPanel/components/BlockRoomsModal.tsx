import { useEffect, useState } from "react";
import {
  X,
  Loader2,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { blockSelectedRoomsApi } from "@/api/bookingApi";

interface Room {
  _id: string;
  number: string;
  type: string;
}

interface Conflict {
  roomId: string;
  roomNumber: string;
  status: string;
  checkIn: string;
  checkOut: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  defaultRoomIds?: string[];
  defaultCheckIn?: string;
  onSuccess?: () => void;
}

export function BlockRoomsModal({
  isOpen,
  onClose,
  rooms,
  defaultRoomIds,
  defaultCheckIn,
  onSuccess,
}: Props) {
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    setConflicts([]);

    if (defaultRoomIds) setSelectedRooms(defaultRoomIds);
    if (defaultCheckIn) setCheckIn(defaultCheckIn);
  }, [isOpen, defaultRoomIds, defaultCheckIn]);

  const getConflict = (roomId: string) =>
    conflicts.find((c) => c.roomId === roomId);

  const toggleRoom = (roomId: string) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId],
    );
  };

  const clearSelection = () => {
    setSelectedRooms([]);
  };

  const toggleSelectAll = () => {
    if (selectedRooms.length === rooms.length) {
      setSelectedRooms([]);
    } else {
      setSelectedRooms(rooms.map((r) => r._id));
    }
  };

  const handleBlock = async () => {
    if (!checkIn || !checkOut) {
      toast.error("Select date range");
      return;
    }

    if (selectedRooms.length === 0) {
      toast.error("Select at least one room");
      return;
    }

    setLoading(true);

    try {
      await blockSelectedRoomsApi({
        roomIds: selectedRooms,
        checkIn,
        checkOut,
        reason,
      });

      toast.success("Rooms blocked successfully");

      onClose();
      onSuccess?.();
    } catch (err: any) {
      if (err.response?.status === 409) {
        const conflictData = err.response.data?.conflicts || [];
        setConflicts(conflictData);

        toast.error("Some selected rooms are already booked or blocked");
      } else {
        toast.error("Failed to block rooms");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableRooms = rooms.filter((r) => !getConflict(r._id));
  const conflictRooms = rooms.filter((r) => getConflict(r._id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-4xl border border-gray-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-gray-900">
                Block Rooms
              </h2>
              <p className="text-xs text-gray-500">
                {selectedRooms.length} of {rooms.length} rooms selected
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-gray-900 mb-3">
                    Blocking Period
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-700">
                        Check-in Date & Time
                      </Label>
                      <Input
                        type="datetime-local"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="mt-1.5 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">
                        Check-out Date & Time
                      </Label>
                      <Input
                        type="datetime-local"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="mt-1.5 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-gray-900">
                    Room Selection
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                    {selectedRooms.length} selected
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="h-8 text-xs"
                  >
                    {selectedRooms.length === rooms.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>

                  {selectedRooms.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      className="h-8 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {conflicts.length > 0 && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-red-800">
                      <span className="font-medium">Conflict detected:</span>{" "}
                      {conflicts.length} room(s) cannot be blocked due to
                      existing reservations. They are marked in red but can
                      still be selected if needed.
                    </div>
                  </div>
                </div>
              )}

              {availableRooms.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    Available Rooms ({availableRooms.length})
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {availableRooms.map((room) => {
                      const isSelected = selectedRooms.includes(room._id);

                      return (
                        <button
                          key={room._id}
                          onClick={() => toggleRoom(room._id)}
                          className={cn(
                            "relative border-2 rounded-lg p-3 text-left transition-all duration-200",
                            "hover:shadow-md hover:scale-105 active:scale-95",
                            isSelected
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-blue-300",
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <div
                            className={cn(
                              "font-semibold text-sm mb-0.5",
                              isSelected ? "text-blue-900" : "text-gray-900",
                            )}
                          >
                            {room.number}
                          </div>
                          <div
                            className={cn(
                              "text-xs",
                              isSelected ? "text-blue-700" : "text-gray-500",
                            )}
                          >
                            {room.type}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {conflictRooms.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                    Rooms with Conflicts ({conflictRooms.length})
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {conflictRooms.map((room) => {
                      const conflict = getConflict(room._id);
                      const isSelected = selectedRooms.includes(room._id);

                      return (
                        <button
                          key={room._id}
                          onClick={() => toggleRoom(room._id)}
                          className={cn(
                            "relative border-2 rounded-lg p-3 text-left transition-all duration-200",
                            "hover:shadow-md hover:scale-105 active:scale-95",
                            isSelected
                              ? "border-red-600 bg-red-100 shadow-sm"
                              : "border-red-300 bg-red-50 hover:border-red-400",
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-600 flex items-center justify-center">
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <div
                            className={cn(
                              "font-semibold text-sm mb-0.5",
                              isSelected ? "text-red-900" : "text-red-800",
                            )}
                          >
                            {room.number}
                          </div>
                          <div className="text-xs text-red-600 mb-1">
                            {room.type}
                          </div>
                          {conflict && (
                            <div className="mt-2 pt-2 border-t border-red-200">
                              <div className="text-xs font-medium text-red-700 mb-0.5">
                                {conflict.status}
                              </div>
                              <div className="text-xs text-red-600">
                                {new Date(conflict.checkIn).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" },
                                )}{" "}
                                -{" "}
                                {new Date(conflict.checkOut).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" },
                                )}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <Label className="text-xs font-medium text-gray-700 mb-2 block">
                Reason for Blocking (Optional)
              </Label>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Maintenance, Renovation, VIP Hold, Deep Cleaning..."
                className="bg-white text-sm resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedRooms.length > 0 ? (
              <span className="font-medium">
                {selectedRooms.length} room
                {selectedRooms.length !== 1 ? "s" : ""} will be blocked
              </span>
            ) : (
              <span>No rooms selected</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="min-w-24">
              Cancel
            </Button>
            <Button
              onClick={handleBlock}
              disabled={loading || selectedRooms.length === 0}
              className="min-w-32 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Blocking...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Block Rooms
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
