// src/pages/Dashboard.tsx

import {
  Hotel,
  Users,
  Calendar,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Plus,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import { getRevenueSummaryApi } from "@/api/dashboardApi";

/* ------------------------------------------------------------------ */
/* TYPES                                                              */
/* ------------------------------------------------------------------ */

interface RevenueBlock {
  total: number;
  growth: number;
}

interface RevenueSummaryResponse {
  success: boolean;
  range: string;
  room: RevenueBlock;
  restaurant: RevenueBlock;
  total: number;
}

/* ------------------------------------------------------------------ */
/* TEMP MOCK DATA (WILL BE API LATER)                                  */
/* ------------------------------------------------------------------ */

const stats = [
  { title: "Total Rooms", value: "—", icon: Hotel, color: "text-primary" },
  { title: "Occupied", value: "—", icon: Users, color: "text-room-occupied" },
  { title: "Available", value: "—", icon: Hotel, color: "text-room-available" },
  { title: "Today's Check-ins", value: "—", icon: TrendingUp, color: "text-accent" },
  { title: "Banquet Bookings", value: "—", icon: Calendar, color: "text-primary" },
  { title: "Pending Bills", value: "—", icon: DollarSign, color: "text-warning" },
];

const upcomingCheckIns = [];
const upcomingCheckOuts = [];
const lowInventory = [];

/* ------------------------------------------------------------------ */
/* CONSTANTS                                                          */
/* ------------------------------------------------------------------ */

const revenueFilters = ["Today", "Week", "Month", "Year"] as const;

/* ------------------------------------------------------------------ */
/* DASHBOARD COMPONENT                                                 */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const navigate = useNavigate();

  const [revenueRange, setRevenueRange] =
    useState<"Today" | "Week" | "Month" | "Year">("Today");

  const [revenueData, setRevenueData] =
    useState<RevenueSummaryResponse | null>(null);

  const [loadingRevenue, setLoadingRevenue] = useState(false);

  /* ---------------- FETCH REVENUE ---------------- */

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setLoadingRevenue(true);
        const res = await getRevenueSummaryApi(revenueRange);
        setRevenueData(res);
      } catch (err) {
        console.error("Failed to load revenue summary", err);
      } finally {
        setLoadingRevenue(false);
      }
    };

    fetchRevenue();
  }, [revenueRange]);

  /* ---------------- CHART DATA ---------------- */

  const barChartData = revenueData
    ? [
        { name: "Room", value: revenueData.room.total },
        { name: "Restaurant", value: revenueData.restaurant.total },
      ]
    : [];

  const lineChartData = revenueData
    ? [
        { name: "Room", amount: revenueData.room.total },
        { name: "Restaurant", amount: revenueData.restaurant.total },
      ]
    : [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your hotel overview
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Overview */}
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Overview
            </CardTitle>

            <div className="flex gap-2">
              {revenueFilters.map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={revenueRange === f ? "default" : "outline"}
                  onClick={() => setRevenueRange(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {loadingRevenue ? (
              <p className="text-sm text-muted-foreground">
                Loading revenue...
              </p>
            ) : revenueData ? (
              <div className="grid gap-4 md:grid-cols-3">
                <RevenueCard
                  title="Room Revenue"
                  amount={revenueData.room.total}
                  growth={revenueData.room.growth}
                />

                <RevenueCard
                  title="Restaurant Revenue"
                  amount={revenueData.restaurant.total}
                  growth={revenueData.restaurant.growth}
                />

                <RevenueCard
                  title="Total Revenue"
                  amount={revenueData.total}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No revenue data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#2563eb"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Room vs Restaurant</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <QuickBtn label="New Room Booking" onClick={() => navigate("/rooms/create")} />
            <QuickBtn label="Banquet Booking" onClick={() => navigate("/banquet/create")} />
            <QuickBtn label="Generate Bill" onClick={() => navigate("/billing/create")} />
            <QuickBtn label="Add Menu Item" onClick={() => navigate("/menu/add")} />
            <QuickBtn label="Add Inventory" onClick={() => navigate("/inventory/add")} />
          </CardContent>
        </Card>

        {/* Lists (placeholder) */}
        <div className="grid gap-4 lg:grid-cols-3">
          <ListCard title="Today's Check-ins" data={upcomingCheckIns} />
          <ListCard title="Today's Check-outs" data={upcomingCheckOuts} />
          <InventoryCard />
        </div>
      </div>
    </Layout>
  );
}

/* ------------------------------------------------------------------ */
/* SMALL COMPONENTS                                                    */
/* ------------------------------------------------------------------ */

function RevenueCard({
  title,
  amount,
  growth,
}: {
  title: string;
  amount: number;
  growth?: number;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold">₹ {amount.toLocaleString()}</p>
        {growth !== undefined && (
          <p
            className={`text-sm font-medium ${
              growth >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {growth >= 0 ? "↑" : "↓"} {Math.abs(growth)}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function QuickBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="outline" className="justify-start" onClick={onClick}>
      <Plus className="mr-2 h-4 w-4" /> {label}
    </Button>
  );
}

function ListCard({ title, data }: { title: string; data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data</p>
        ) : (
          data.map((d) => (
            <div key={d._id} className="flex justify-between border rounded p-3">
              <div>
                <p className="font-medium">{d.guest}</p>
                <p className="text-sm text-muted-foreground">
                  Room {d.room} • {d.type}
                </p>
              </div>
              <span className="text-sm font-medium">{d.time}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function InventoryCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Low Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">No alerts</p>
      </CardContent>
    </Card>
  );
}
