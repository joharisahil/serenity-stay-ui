import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getTablesOverviewApi, startTableSessionApi } from "@/api/tableApi";

type TableOverview = {
  tableId: string;
  name: string;
  status: "AVAILABLE" | "OCCUPIED" | "BILLING";
  ordersCount: number;
  total: number;
  sources: string[];
};

export default function BillingList() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableOverview[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTables = async () => {
    setLoading(true);
    try {
      const data = await getTablesOverviewApi();
      if (data.success) {
        setTables(data.tables);
      } else {
        toast.error("Failed to load tables");
      }
    } catch (err) {
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleTableClick = async (table: TableOverview) => {
    try {
      // FREE TABLE → start session → open order screen
      if (table.status === "AVAILABLE") {
        await startTableSessionApi(table.tableId);
        navigate(`/billing/restaurant/create?tableId=${table.tableId}`);
        return;
      }

      // BUSY / BILLING → open existing session
      navigate(`/billing/restaurant/create?tableId=${table.tableId}`);
    } catch (err) {
      toast.error("Failed to open table");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Restaurant Tables</h1>
          <p className="text-muted-foreground">
            Select a table to take orders or checkout
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
                No tables found
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {tables.map((t) => {
                  const isFree = t.status === "AVAILABLE";

                  return (
                    <div
                      key={t.tableId}
                      className={`border rounded-xl p-4 space-y-2 transition-shadow hover:shadow-md
                        ${isFree ? "bg-green-50" : "bg-yellow-50"}
                      `}
                    >
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">
                          Table {t.name}
                        </h2>

                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium
                            ${isFree
                              ? "bg-green-600 text-white"
                              : "bg-yellow-600 text-white"}
                          `}
                        >
                          {isFree ? "FREE" : "BUSY"}
                        </span>
                      </div>

                      {!isFree && (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Orders: {t.ordersCount}
                          </p>

                          <p className="font-bold text-primary">
                            ₹{t.total.toFixed(2)}
                          </p>

                          <div className="flex gap-2 text-xs">
                            {t.sources.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 bg-gray-200 rounded-full"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </>
                      )}

                      <Button
                        className="w-full mt-2"
                        variant={isFree ? "default" : "outline"}
                        onClick={() => handleTableClick(t)}
                      >
                        {isFree ? "Start Order" : "Open Table"}
                      </Button>
                    </div>
                  );
                })}

              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
