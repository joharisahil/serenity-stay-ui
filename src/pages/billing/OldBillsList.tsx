// src/pages/ViewBillPage.tsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { getAllBillsApi } from "@/api/billApi";

export default function OldBillsPage() {
    const navigate = useNavigate();

    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeType, setActiveType] = useState("RESTAURANT"); // default tab
    const [search, setSearch] = useState("");

    // ------------ LOAD ALL BILLS ------------
    const loadBills = async () => {
        try {
            const data = await getAllBillsApi();
            if (data.success) {
                setBills(data.bills);
            }
        } catch (err) {
            toast.error("Failed to load bills");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadBills();
    }, []);

    // ------------ FILTERED BILLS ------------
    const filteredBills = useMemo(() => {
        return bills
            .filter((b) => b.source === activeType) // match TYPE (ROOM/RESTAURANT/BANQUET)
            .filter((b) => {
                const text = search.toLowerCase();
                return (
                    b.customerName?.toLowerCase().includes(text) ||
                    b.customerPhone?.toLowerCase().includes(text) ||
                    b.billNumber?.toLowerCase().includes(text)
                );
            });
    }, [activeType, search, bills]);

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
                        <p className="text-muted-foreground">View room,  or banquet bills</p>
                    </div>
                </div>

                {/* --- TABS --- */}
                <Tabs value={activeType} onValueChange={setActiveType} className="w-full">
                    <TabsList className="grid grid-cols-3 mb-4">
                        <TabsTrigger value="RESTAURANT">Restaurant</TabsTrigger>
                        <TabsTrigger value="ROOM">Room</TabsTrigger>
                        <TabsTrigger value="BANQUET">Banquet</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* SEARCH BAR */}
                <div className="flex items-center gap-2 mb-4">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by customer name, phone, bill number..."
                        className="w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* BILL LIST */}
                <Card>
                    <CardContent className="pt-6">
                        {loading ? (
                            <p className="text-center text-muted-foreground">Loading...</p>
                        ) : filteredBills.length === 0 ? (
                            <p className="text-center text-muted-foreground py-10">
                                No bills found
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredBills.map((bill) => (
                                    <div
                                        key={bill._id}
                                        className="border p-4 rounded-lg flex justify-between items-center"
                                    >
                                        <div>
                                            <h2 className="text-lg font-semibold">
                                                Bill #{bill.billNumber}
                                            </h2>

                                            {bill.source === "RESTAURANT" && (
                                                <p className="text-sm text-muted-foreground">
                                                    Table: {bill.table_id?.name}
                                                </p>
                                            )}
                                            {bill.source === "ROOM" && (
                                                <p className="text-sm text-muted-foreground">
                                                    Room: {bill.room_id?.number}
                                                </p>
                                            )}
                                            {bill.source === "BANQUET" && (
                                                <p className="text-sm text-muted-foreground">
                                                    Banquet: {bill.banquet_id?.name}
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

                                        <Button onClick={() => navigate(`/view/${bill._id}`)}>
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
