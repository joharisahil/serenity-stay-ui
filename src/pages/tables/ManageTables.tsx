import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, MapPin, Edit, Eye, Trash2, Table } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { deleteTableApi, listTablesApi } from "@/api/tableApi";

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

// IMPORT YOUR CreateTableDialog — you must build this like CreateRoomDialog
import { CreateTableDialog } from "@/components/CreateTableDialog";

const statusConfig: any = {
  AVAILABLE: { label: "Available", className: "bg-green-600 text-white" },
  OCCUPIED: { label: "Occupied", className: "bg-red-600 text-white" },
  RESERVED: { label: "Reserved", className: "bg-yellow-500 text-white" },
  MAINTENANCE: { label: "Maintenance", className: "bg-gray-600 text-white" },
};

export default function ManageTables() {
  const navigate = useNavigate();

  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadTables = async () => {
    try {
      const data = await listTablesApi();
      setTables(Array.isArray(data.tables) ? data.tables : []);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to fetch tables");
      setTables([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const filteredTables = tables.filter((table: any) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (tableId: string) => {
    navigate(`/tables/edit/${tableId}`);
  };

  const handleView = (tableId: string) => {
    navigate(`/tables/view/${tableId}`);
  };

  const handleDelete = (tableId: string) => {
    setDeleteId(tableId);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteTableApi(deleteId);
      toast.success("Table deleted successfully!");
      loadTables();
    } catch {
      toast.error("Failed to delete table");
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
              <Table className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Manage Tables</h1>
              <p className="text-muted-foreground">Create, view & manage restaurant tables</p>
            </div>
          </div>

          <CreateTableDialog onCreated={loadTables} />
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search table by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="w-full flex justify-center py-10">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}


        {/* Table Grid */}
        {!loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTables.map((table: any) => {
              const status = table.status?.toUpperCase() || "AVAILABLE";

              return (
                <Card key={table._id} className="transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="space-y-4">

                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-2xl font-bold">Table  {table.name}</h3>
                          {table.locationDesc && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {table.locationDesc}
                            </p>
                          )}
                        </div>

                        <Badge className={statusConfig[status]?.className || "bg-gray-500 text-white"}>
                          {statusConfig[status]?.label || status}
                        </Badge>
                      </div>

                      {/* Capacity */}
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{table.capacity} Guests</span>
                      </div>

                      {/* QR Code Section */}
                      {table.qrUrl && (
                        <div className="border-t pt-4">
                          <p className="text-xs text-muted-foreground pb-2">QR Code</p>
                          <img
                            src={`https://quickchart.io/qr?text=${encodeURIComponent(table.qrUrl)}`}
                            alt="QR Code"
                            className="h-32 w-32 rounded-md"
                          />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="border-t pt-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleView(table._id)}>
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(table._id)}>
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button variant="outline" size="sm" className="flex-1 text-destructive" onClick={() => handleDelete(table._id)}>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the table. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete Table</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Layout>
  );
}
