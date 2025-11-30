import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPendingRestaurantTablesApi } from "@/api/billingRestaurantApi";

export default function BillingList() {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getPendingRestaurantTablesApi();
      if (data.success) setTables(data.tables);
      setLoading(false);
    };

    load();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Restaurant Billing</h1>
          <p className="text-muted-foreground">
            Select a table to generate the final bill
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : tables.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                No pending restaurant bills 🎉
              </p>
            ) : null}


            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tables.map((t) => (
                <div key={t.tableId} className="border p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold">Table {t.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {t.orders.length} delivered orders
                    </p>
                    <p className="text-primary font-bold">Total: ₹{t.summary.total}</p>
                  </div>

                  <Button onClick={() => navigate(`/billing/restaurant/${t.tableId}`)}>
                    <Eye className="mr-2 h-4 w-4" /> View Bill
                  </Button>
                </div>
              ))}

            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
