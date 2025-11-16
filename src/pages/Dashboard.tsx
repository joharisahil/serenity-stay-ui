import { Hotel, Users, Calendar, AlertTriangle, DollarSign, TrendingUp, Plus } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const stats = [
  { title: "Total Rooms", value: "50", icon: Hotel, color: "text-primary" },
  { title: "Occupied", value: "35", icon: Users, color: "text-room-occupied" },
  { title: "Available", value: "15", icon: Hotel, color: "text-room-available" },
  { title: "Today's Check-ins", value: "8", icon: TrendingUp, color: "text-accent" },
  { title: "Banquet Bookings", value: "3", icon: Calendar, color: "text-primary" },
  { title: "Pending Bills", value: "12", icon: DollarSign, color: "text-warning" },
];

const upcomingCheckIns = [
  { guest: "Rajesh Kumar", room: "101", time: "2:00 PM", type: "Deluxe" },
  { guest: "Priya Sharma", room: "205", time: "3:30 PM", type: "Suite" },
  { guest: "Amit Patel", room: "310", time: "4:00 PM", type: "Standard" },
];

const upcomingCheckOuts = [
  { guest: "Sanjay Mehta", room: "102", time: "11:00 AM", type: "Deluxe" },
  { guest: "Neha Gupta", room: "208", time: "12:00 PM", type: "Suite" },
];

const lowInventory = [
  { item: "Towels", quantity: 15, threshold: 50 },
  { item: "Bed Sheets", quantity: 20, threshold: 40 },
  { item: "Soap Bars", quantity: 25, threshold: 100 },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your hotel overview</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Button onClick={() => navigate("/rooms/create")} className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                New Room Booking
              </Button>
              <Button onClick={() => navigate("/banquet/create")} variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Banquet Booking
              </Button>
              <Button onClick={() => navigate("/billing/create")} variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Generate Bill
              </Button>
              <Button onClick={() => navigate("/menu/add")} variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Add Menu Item
              </Button>
              <Button onClick={() => navigate("/inventory/add")} variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Add Inventory
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Three Column Layout */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Upcoming Check-ins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Today's Check-ins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingCheckIns.map((booking) => (
                  <div key={booking.room} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <p className="font-medium">{booking.guest}</p>
                      <p className="text-sm text-muted-foreground">
                        Room {booking.room} • {booking.type}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary">{booking.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Check-outs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-room-occupied" />
                Today's Check-outs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingCheckOuts.map((booking) => (
                  <div key={booking.room} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <p className="font-medium">{booking.guest}</p>
                      <p className="text-sm text-muted-foreground">
                        Room {booking.room} • {booking.type}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-destructive">{booking.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Low Inventory Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Low Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowInventory.map((item) => (
                  <div key={item.item} className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 p-3">
                    <div className="space-y-1">
                      <p className="font-medium">{item.item}</p>
                      <p className="text-sm text-muted-foreground">
                        Min: {item.threshold}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-warning">{item.quantity} left</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
