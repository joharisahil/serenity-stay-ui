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
import { listRoomsApi } from "@/api/roomApi";

const statusConfig = {
  available: { label: "Available", className: "bg-room-available text-white" },
  occupied: { label: "Occupied", className: "bg-room-occupied text-white" },
  cleaning: { label: "Cleaning", className: "bg-room-cleaning text-white" },
  maintenance: { label: "Maintenance", className: "bg-room-maintenance text-white" },
};

export default function ManageRooms() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const data = await listRoomsApi();
        setRooms(Array.isArray(data.rooms) ? data.rooms : []);
        setLoading(false);

      } catch (err) {
        toast.error("Failed to fetch rooms");
        setRooms([]);
      }
    };
    loadRooms();
  }, []);

  const filteredRooms = rooms.filter(
    (room) =>
      room.number.includes(searchTerm) ||
      room.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (roomNumber: string) => {
    toast.success(`Room ${roomNumber} deleted successfully`);
  };

  const handleEdit = (roomNumber: string) => {
    toast.info(`Edit room ${roomNumber}`);
  };

  const handleView = (roomNumber: string) => {
    navigate(`/rooms/bookings/${roomNumber}`);
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
          <CreateRoomDialog />
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
              const status = (room.status || "available").toLowerCase();

              return (
                <Card key={room._id} className="transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-2xl font-bold">Room {room.number}</h3>
                          <p className="text-sm text-muted-foreground">Floor {room.floor}</p>
                        </div>
                        <Badge className={statusConfig[status].className}>
                          {statusConfig[status].label}
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
                            onClick={() => handleView(room.number)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1"
                            onClick={() => handleEdit(room.number)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-destructive"
                            onClick={() => handleDelete(room.number)}
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
    </Layout>
  );
}
