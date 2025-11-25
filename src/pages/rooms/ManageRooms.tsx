import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Bed, Users, Edit, Eye, Trash2, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { deleteRoomApi, listRoomsApi } from "@/api/roomApi";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const statusConfig = {
  AVAILABLE: { label: "Available", className: "bg-room-available text-white" },
  OCCUPIED: { label: "Occupied", className: "bg-room-occupied text-white" },
  CLEANING: { label: "Cleaning", className: "bg-room-cleaning text-white" },
  MAINTENANCE: { label: "Maintenance", className: "bg-room-maintenance text-white" },
};

export default function ManageRooms() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);


  const loadRooms = async () => {
    try {
      const data = await listRoomsApi();
      setRooms(Array.isArray(data.rooms) ? data.rooms : []);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to fetch rooms");
      setRooms([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const filteredRooms = rooms.filter(
    (room) =>
      room.number.includes(searchTerm) ||
      room.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (roomId: string) => {
    navigate(`/rooms/edit/${roomId}`);
  };

  const handleView = (roomId: string) => {
    navigate(`/rooms/view/${roomId}`);
  };
  
  const handleDeleteClick = (roomId: string) => {
   setDeleteId(roomId);
   setDeleteOpen(true);
  };

  const confirmDelete = async () => {
  if (!deleteId) return;

  try {
    await deleteRoomApi(deleteId);
    toast.success("Room deleted successfully!");

    // Reload rooms after delete
    loadRooms();
  } catch {
    toast.error("Failed to delete room");
  } finally {
    setDeleteOpen(false);
  }
};

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Manage Rooms</h1>
              <p className="text-muted-foreground">Create, edit, and delete hotel rooms</p>
            </div>
          </div>
         <CreateRoomDialog onRoomCreated={loadRooms} />
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by room number or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && <p>Loading rooms...</p>}

        {/* Room Grid */}
        {!loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRooms.map((room: any) => {
              const status = room.status?.toUpperCase() || "AVAILABLE";

              return (
                <Card key={room._id} className="transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-2xl font-bold">Room {room.number}</h3>
                          <p className="text-sm text-muted-foreground">Floor {room.floor}</p>
                        </div>
                        <Badge className={statusConfig[status]?.className || "bg-gray-500 text-white"}>
                          {statusConfig[status]?.label || status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Bed className="h-4 w-4 text-muted-foreground" />
                          <span>{room.type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{room.maxGuests} Guests</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-muted-foreground">Price per night</span>
                          <span className="text-lg font-bold text-primary">₹{room.baseRate}</span>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1"
                            onClick={() => handleView(room._id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1"
                            onClick={() => handleEdit(room._id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-destructive"
                            onClick={() => handleDeleteClick(room._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete the room.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={confirmDelete}>
        Delete Room
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

    </Layout>
  );
}
