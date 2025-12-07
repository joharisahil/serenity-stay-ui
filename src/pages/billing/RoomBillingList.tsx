import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPendingRoomBillsApi } from "@/api/billingRestaurantApi"; 

export default function RoomBillingList() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getPendingRoomBillsApi();
      if (data.success) setRooms(data.rooms);
      setLoading(false);
    };

    load();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Room Restaurant Billing</h1>
          <p className="text-muted-foreground">
            Rooms with delivered restaurant orders
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : rooms.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                No pending room restaurant bills 🎉
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rooms.map((r) => (
                  <div
                    key={r.roomId}
                    className="border p-4 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <h2 className="text-lg font-semibold">Room {r.number}</h2>
                      <p className="text-sm text-muted-foreground">
                        {r.orders.length} delivered orders
                      </p>
                      <p className="text-primary font-bold">
                        Total: ₹{r.summary.total}
                      </p>

                      <Badge className="mt-2">Restaurant Bill</Badge>
                    </div>

                    <Button
                      onClick={() => navigate(`/billing/restaurant/room/${r.roomId}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> View Bill
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
