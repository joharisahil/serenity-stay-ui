import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, QrCode, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getTableApi } from "@/api/tableApi";

const statusConfig: any = {
  AVAILABLE: { label: "Available", className: "bg-green-600 text-white" },
  OCCUPIED: { label: "Occupied", className: "bg-red-600 text-white" },
  RESERVED: { label: "Reserved", className: "bg-yellow-500 text-white" },
  MAINTENANCE: { label: "Maintenance", className: "bg-gray-600 text-white" },
};

export default function ViewTablePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<any>(null);

  useEffect(() => {
    const loadTable = async () => {
      try {
        const data = await getTableApi(id!);
        setTable(data);
      } catch (err) {
        toast.error("Unable to fetch table details");
      } finally {
        setLoading(false);
      }
    };

    loadTable();
  }, [id]);

  if (loading) return <Layout><p>Loading...</p></Layout>;
  if (!table) return <Layout><p>Table Not Found</p></Layout>;

  const status = table.status?.toUpperCase() || "AVAILABLE";

  return (
    <Layout>
      <div className="space-y-6">

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/tables/manage")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Table {table.name}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Table Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* Name + Status */}
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Table Number: {table.name}</h2>

                {table.locationDesc && (
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {table.locationDesc}
                  </p>
                )}
              </div>

              <Badge className={statusConfig[status]?.className || "bg-gray-500 text-white"}>
                {statusConfig[status]?.label || status}
              </Badge>
            </div>

            {/* Capacity */}
            <div className="border p-4 rounded-md flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="font-semibold">{table.capacity} Guests</p>
              </div>
            </div>

{/* QR Code */}
<div className="border p-4 rounded-md">
  <p className="text-sm font-medium mb-2 flex items-center gap-2">
    <QrCode className="h-4 w-4" /> Table QR Code
  </p>

  <div className="flex flex-col items-center gap-4">

    {table.qrUrl ? (
      <>
        <img
          id="table-qr-img"
          src={`https://quickchart.io/qr?text=${encodeURIComponent(table.qrUrl)}`}
          alt="QR Code"
          className="h-40 w-40 rounded-md border"
        />

        {/* DOWNLOAD BUTTON */}
        <Button
          type="button"
          onClick={() => {
            const qrSrc = `https://quickchart.io/qr?text=${encodeURIComponent(
              table.qrUrl
            )}`;

            const link = document.createElement("a");
            link.href = qrSrc;
            link.download = `table-${table.name || table._id}.png`;
            link.click();
          }}
        >
          Download QR
        </Button>
      </>
    ) : (
      <p className="text-muted-foreground text-sm">QR not generated</p>
    )}

    {table.qrUrl && (
      <p className="text-xs mt-2 text-center break-all text-muted-foreground">
        {table.qrUrl}
      </p>
    )}
  </div>
</div>


            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground border-t pt-4">
              <div>
                <p className="font-medium">Created At</p>
                <p>{new Date(table.createdAt).toLocaleString()}</p>
              </div>

              <div>
                <p className="font-medium">Last Updated</p>
                <p>{new Date(table.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Back Button */}
            <Button onClick={() => navigate("/tables/manage")} className="w-full mt-4">
              Back to Table List
            </Button>

          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
