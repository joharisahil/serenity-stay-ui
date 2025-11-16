import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Bed, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const rooms = [
  { number: "101", type: "Standard", price: 2500, status: "available", floor: 1, capacity: 2 },
  { number: "102", type: "Deluxe", price: 3500, status: "occupied", floor: 1, capacity: 2, guest: "Rajesh Kumar" },
  { number: "103", type: "Standard", price: 2500, status: "cleaning", floor: 1, capacity: 2 },
  { number: "201", type: "Suite", price: 5500, status: "available", floor: 2, capacity: 4 },
  { number: "202", type: "Deluxe", price: 3500, status: "occupied", floor: 2, capacity: 2, guest: "Priya Sharma" },
  { number: "203", type: "Standard", price: 2500, status: "maintenance", floor: 2, capacity: 2 },
  { number: "301", type: "Suite", price: 5500, status: "available", floor: 3, capacity: 4 },
  { number: "302", type: "Deluxe", price: 3500, status: "available", floor: 3, capacity: 2 },
  { number: "303", type: "Standard", price: 2500, status: "occupied", floor: 3, capacity: 2, guest: "Amit Patel" },
  { number: "401", type: "Suite", price: 5500, status: "occupied", floor: 4, capacity: 4, guest: "Sanjay Mehta" },
  { number: "402", type: "Deluxe", price: 3500, status: "cleaning", floor: 4, capacity: 2 },
  { number: "403", type: "Standard", price: 2500, status: "available", floor: 4, capacity: 2 },
];

const statusConfig = {
  available: { label: "Available", className: "bg-room-available text-white" },
  occupied: { label: "Occupied", className: "bg-room-occupied text-white" },
  cleaning: { label: "Cleaning", className: "bg-room-cleaning text-white" },
  maintenance: { label: "Maintenance", className: "bg-room-maintenance text-white" },
};

export default function RoomList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredRooms = rooms.filter(
    (room) =>
      (filterStatus === "all" || room.status === filterStatus) &&
      (room.number.includes(searchTerm) || room.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Room Management</h1>
            <p className="text-muted-foreground">View and manage all hotel rooms</p>
          </div>
          <Button onClick={() => navigate("/rooms/create")}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by room number or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "available" ? "default" : "outline"}
                  onClick={() => setFilterStatus("available")}
                >
                  Available
                </Button>
                <Button
                  variant={filterStatus === "occupied" ? "default" : "outline"}
                  onClick={() => setFilterStatus("occupied")}
                >
                  Occupied
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRooms.map((room) => (
            <Card
              key={room.number}
              className="cursor-pointer transition-all hover:shadow-lg"
              onClick={() => navigate(`/rooms/${room.number}`)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">Room {room.number}</h3>
                      <p className="text-sm text-muted-foreground">Floor {room.floor}</p>
                    </div>
                    <Badge className={statusConfig[room.status as keyof typeof statusConfig].className}>
                      {statusConfig[room.status as keyof typeof statusConfig].label}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Bed className="h-4 w-4 text-muted-foreground" />
                      <span>{room.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{room.capacity} Guests</span>
                    </div>
                  </div>

                  {room.guest && (
                    <div className="rounded-lg bg-secondary/50 p-2">
                      <p className="text-xs text-muted-foreground">Guest</p>
                      <p className="text-sm font-medium">{room.guest}</p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price per night</span>
                      <span className="text-lg font-bold text-primary">₹{room.price}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
