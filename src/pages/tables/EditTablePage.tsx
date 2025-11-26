import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getTableApi, updateTableApi } from "@/api/tableApi";
import { ArrowLeft } from "lucide-react";

export default function EditTablePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
    locationDesc: "",
    status: "AVAILABLE",
  });

  useEffect(() => {
    const loadTable = async () => {
      try {
        const data = await getTableApi(id!);
        setTable(data);

        setFormData({
          name: data.name || "",
          capacity: data.capacity?.toString() || "",
          locationDesc: data.locationDesc || "",
          status: data.status || "AVAILABLE",
        });
      } catch (err) {
        toast.error("Unable to load table");
      } finally {
        setLoading(false);
      }
    };

    loadTable();
  }, [id]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      capacity: formData.capacity ? Number(formData.capacity) : undefined,
      locationDesc: formData.locationDesc || undefined,
      status: formData.status,
    };

    try {
      await updateTableApi(id!, payload);
      toast.success("Table updated successfully!");
      navigate("/tables/manage");
    } catch (err) {
      toast.error("Failed to update table");
    }
  };

 if (loading) return <Layout><p>Loading...</p></Layout>;
 if (!table) return <Layout><p>Error: Table not found</p></Layout>;

  return (
    <Layout>
      <div className="space-y-6">

        {/* Back Button + Title */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/tables/manage")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Table {table.name}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Table Details</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="grid grid-cols-2 gap-4">

                {/* Name */}
                <div>
                  <Label>Table Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                {/* Capacity */}
                <div>
                  <Label>Capacity (Guests)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                  />
                </div>

                {/* Location */}
                <div className="col-span-2">
                  <Label>Location Description</Label>
                  <Input
                    value={formData.locationDesc}
                    onChange={(e) =>
                      setFormData({ ...formData, locationDesc: e.target.value })
                    }
                    placeholder="e.g., Near window, Outdoor area"
                  />
                </div>

                {/* Status */}
                <div>
                  <Label>Status</Label>
                  <select
                    className="border rounded-md px-3 py-2 w-full"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>

              </div>

              <Button type="submit" className="w-full">
                Update Table
              </Button>

            </form>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
