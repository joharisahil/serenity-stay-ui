import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  Building2,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { deleteRoomApi, listRoomsApi } from "@/api/roomApi";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

/* ================= THEME STATUS COLORS ================= */

const statusConfig = {
  AVAILABLE: { label: "Available", className: "bg-room-available text-white" },
  OCCUPIED: { label: "Occupied", className: "bg-room-occupied text-white" },
  CLEANING: { label: "Cleaning", className: "bg-room-cleaning text-white" },
  MAINTENANCE: { label: "Maintenance", className: "bg-room-maintenance text-white" },
};

type SortField = "number" | "floor" | "type" | "maxGuests" | "baseRate";
type SortOrder = "asc" | "desc";

export default function ManageRooms() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [floorFilter, setFloorFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("number");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  /* ================= LOAD ROOMS ================= */

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await listRoomsApi();
      setRooms(Array.isArray(data.rooms) ? data.rooms : []);
    } catch {
      toast.error("Failed to fetch rooms");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  /* ================= FILTER + SORT ================= */

  const uniqueFloors = useMemo(() => {
    return [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);
  }, [rooms]);

  const uniqueTypes = useMemo(() => {
    return [...new Set(rooms.map((r) => r.type))].sort();
  }, [rooms]);

  const filteredAndSortedRooms = useMemo(() => {
    let filtered = rooms.filter((room) => {
      const number = String(room.number || "").toLowerCase();
      const type = String(room.type || "").toLowerCase();
      const search = searchTerm.toLowerCase();

      return (
        (number.includes(search) || type.includes(search)) &&
        (statusFilter === "ALL" || room.status === statusFilter) &&
        (floorFilter === "ALL" || String(room.floor) === floorFilter) &&
        (typeFilter === "ALL" || room.type === typeFilter)
      );
    });

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "number") {
        aVal = Number(a.number);
        bVal = Number(b.number);
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [rooms, searchTerm, statusFilter, floorFilter, typeFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleEdit = (id: string) => navigate(`/rooms/edit/${id}`);
  const handleView = (id: string) => navigate(`/rooms/view/${id}`);

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteRoomApi(deleteId);
      toast.success("Room deleted successfully");
      loadRooms();
    } catch {
      toast.error("Failed to delete room");
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  /* ================= UI ================= */

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Manage Rooms</h1>
              <p className="text-muted-foreground">
                Create, edit, and manage hotel rooms
              </p>
            </div>
          </div>

          <CreateRoomDialog onRoomCreated={loadRooms} />
        </div>

        {/* FILTERS */}
        <div className="bg-card border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">

          <Input
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="OCCUPIED">Occupied</SelectItem>
              <SelectItem value="CLEANING">Cleaning</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>

          <Select value={floorFilter} onValueChange={setFloorFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Floors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Floors</SelectItem>
              {uniqueFloors.map((floor) => (
                <SelectItem key={floor} value={String(floor)}>
                  Floor {floor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>

        {/* TABLE */}
        <div className="bg-card border rounded-lg overflow-hidden">
  <table className="w-full text-sm">
    <thead className="bg-muted">
      <tr className="text-left">
        <th
          onClick={() => handleSort("number")}
          className="px-6 py-4 cursor-pointer font-medium"
        >
          Room <ArrowUpDown className="inline h-3 w-3 ml-1" />
        </th>

        <th
          onClick={() => handleSort("floor")}
          className="px-6 py-4 cursor-pointer font-medium text-center"
        >
          Floor <ArrowUpDown className="inline h-3 w-3 ml-1" />
        </th>

        <th
          onClick={() => handleSort("type")}
          className="px-6 py-4 cursor-pointer font-medium"
        >
          Type <ArrowUpDown className="inline h-3 w-3 ml-1" />
        </th>

        <th
          onClick={() => handleSort("maxGuests")}
          className="px-6 py-4 cursor-pointer font-medium text-center"
        >
          Guests <ArrowUpDown className="inline h-3 w-3 ml-1" />
        </th>

        <th className="px-6 py-4 font-medium text-center">
          Status
        </th>

        <th
          onClick={() => handleSort("baseRate")}
          className="px-6 py-4 cursor-pointer font-medium text-center"
        >
          Rate <ArrowUpDown className="inline h-3 w-3 ml-1" />
        </th>

        <th className="px-6 py-4 font-medium text-center w-[140px]">
          Actions
        </th>
      </tr>
    </thead>

    <tbody>
      {filteredAndSortedRooms.map((room, index) => {
        const status = room.status?.toUpperCase() || "AVAILABLE";

        return (
          <tr
            key={room._id}
            className={`transition-colors hover:bg-muted/50 ${
              index % 2 === 0 ? "bg-background" : "bg-muted/30"
            }`}
          >
            <td className="px-6 py-4 font-medium">
              {room.number}
            </td>

            <td className="px-6 py-4 text-center">
              {room.floor}
            </td>

            <td className="px-6 py-4">
              {room.type}
            </td>

            <td className="px-6 py-4 text-center">
              {room.maxGuests}
            </td>

            <td className="px-6 py-4 text-center">
              <Badge className={statusConfig[status]?.className}>
                {statusConfig[status]?.label}
              </Badge>
            </td>

            <td className="px-6 py-4 text-center font-medium">
              ₹{room.baseRate}
            </td>

            <td className="px-6 py-4">
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleView(room._id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(room._id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteClick(room._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>


      </div>

      {/* DELETE DIALOG */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
