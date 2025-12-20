// src/pages/ViewBillPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { getBillsApi, getRoomBillsApi } from "@/api/billApi";

export default function OldBillsPage() {
  const navigate = useNavigate();

  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeType, setActiveType] = useState<"RESTAURANT" | "ROOM" | "BANQUET">("RESTAURANT");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  /* ---------------- LOAD BILLS ---------------- */

  const loadBills = async (type: typeof activeType, pageNo = 1) => {
    setLoading(true);
    try {
      let res;
      const params = {
        page: pageNo,
        limit,
        search: search || undefined
      };

      if (type === "ROOM") {
        res = await getRoomBillsApi(params);
      } else {
        res = await getBillsApi({ ...params, source: type });
      }

      if (res?.success) {
        setBills(res.bills || []);
        setTotal(res.total || 0);
        setPage(pageNo);
      }
    } catch (err) {
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- EFFECTS ---------------- */

  // initial load
  useEffect(() => {
    loadBills("RESTAURANT", 1);
  }, []);

  // tab change
  useEffect(() => {
    setPage(1);
    loadBills(activeType, 1);
  }, [activeType]);

  // search debounce (simple)
  useEffect(() => {
    const t = setTimeout(() => {
      loadBills(activeType, 1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  /* ---------------- UI ---------------- */

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/billing")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">All Bills</h1>
            <p className="text-muted-foreground">
              View restaurant, room & banquet bills
            </p>
          </div>
        </div>

        {/* TABS */}
        <Tabs value={activeType} onValueChange={(v) => setActiveType(v as any)}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="RESTAURANT">Restaurant</TabsTrigger>
            <TabsTrigger value="ROOM">Room</TabsTrigger>
            <TabsTrigger value="BANQUET">Banquet</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* SEARCH */}
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by bill no, name, phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* BILL LIST */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : bills.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                No bills found
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bills.map((bill) => (
                  <div
                    key={bill._id}
                    className="border p-4 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <h2 className="text-lg font-semibold">
                        Bill #{bill.billNumber}
                      </h2>

                      {bill.table && (
                        <p className="text-sm text-muted-foreground">
                          Table: {bill.table.name}
                        </p>
                      )}

                      {bill.room && (
                        <p className="text-sm text-muted-foreground">
                          Room: {bill.room.number}
                        </p>
                      )}

                      {bill.banquet && (
                        <p className="text-sm text-muted-foreground">
                          Banquet: {bill.banquet.name}
                        </p>
                      )}

                      <p className="text-sm text-muted-foreground">
                        Customer: {bill.customerName || "N/A"}
                      </p>

                      <p className="text-primary font-bold">
                        ₹{bill.finalAmount}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {new Date(bill.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <Button
                      onClick={() =>
                        navigate(`/view/${bill.source.toLowerCase()}/${bill._id}`)
                      }
                    >
                      <Eye className="mr-2 h-4 w-4" /> View Bill
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* PAGINATION */}
            {!loading && total > limit && (
              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => loadBills(activeType, page - 1)}
                >
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(total / limit)}
                </span>

                <Button
                  variant="outline"
                  disabled={page * limit >= total}
                  onClick={() => loadBills(activeType, page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
