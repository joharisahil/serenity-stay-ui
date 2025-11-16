import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Download, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const bills = [
  { id: "INV-001", customer: "Rajesh Kumar", amount: 15400, date: "2025-11-15", type: "Room", status: "paid" },
  { id: "INV-002", customer: "Sharma Family", amount: 690000, date: "2025-11-15", type: "Banquet", status: "pending" },
  { id: "INV-003", customer: "Priya Sharma", amount: 12800, date: "2025-11-14", type: "Room", status: "paid" },
  { id: "INV-004", customer: "Walk-in Customer", amount: 2400, date: "2025-11-14", type: "Restaurant", status: "paid" },
  { id: "INV-005", customer: "Amit Patel", amount: 8600, date: "2025-11-13", type: "Room", status: "pending" },
];

const statusColors = {
  paid: "bg-success text-white",
  pending: "bg-warning text-white",
  cancelled: "bg-destructive text-white",
};

export default function BillingList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredBills = bills.filter(
    (bill) =>
      (filterType === "all" || bill.type.toLowerCase() === filterType) &&
      (bill.customer.toLowerCase().includes(searchTerm.toLowerCase()) || bill.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Billing History</h1>
            <p className="text-muted-foreground">View and manage all invoices</p>
          </div>
          <Button onClick={() => navigate("/billing/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Bill
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => setFilterType("all")}
                >
                  All
                </Button>
                <Button
                  variant={filterType === "room" ? "default" : "outline"}
                  onClick={() => setFilterType("room")}
                >
                  Room
                </Button>
                <Button
                  variant={filterType === "banquet" ? "default" : "outline"}
                  onClick={() => setFilterType("banquet")}
                >
                  Banquet
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium">Invoice</th>
                  <th className="p-4 text-left text-sm font-medium">Customer</th>
                  <th className="p-4 text-left text-sm font-medium">Type</th>
                  <th className="p-4 text-left text-sm font-medium">Date</th>
                  <th className="p-4 text-left text-sm font-medium">Amount</th>
                  <th className="p-4 text-left text-sm font-medium">Status</th>
                  <th className="p-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4">
                      <span className="font-mono text-sm font-medium">{bill.id}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">{bill.customer}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{bill.type}</Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(bill.date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-primary">₹{bill.amount.toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      <Badge className={statusColors[bill.status as keyof typeof statusColors]}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
