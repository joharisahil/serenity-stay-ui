import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RoomList from "./pages/rooms/RoomList";
import ManageRooms from "./pages/rooms/ManageRooms";
import CreateBooking from "./pages/rooms/CreateBooking";
import BookingDetails from "./pages/rooms/BookingDetails";
import BanquetCalendar from "./pages/banquet/BanquetCalendar";
import CreateBanquet from "./pages/banquet/CreateBanquet";
import BanquetDetails from "./pages/banquet/BanquetDetails";
import MenuList from "./pages/menu/MenuList";
import AddMenuItem from "./pages/menu/AddMenuItem";
import QRMenuGenerator from "./pages/menu/QRMenuGenerator";
import CustomerMenu from "./pages/menu/CustomerMenu";
import KitchenOrders from "./pages/kitchen/KitchenOrders";
import GenerateBill from "./pages/billing/GenerateBill";
import BillingList from "./pages/billing/BillingList";
import InventoryDashboard from "./pages/inventory/InventoryDashboard";
import AddInventory from "./pages/inventory/AddInventory";
import InventoryList from "./pages/inventory/InventoryList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Room Routes */}
          <Route path="/rooms/manage" element={<ManageRooms />} />
          <Route path="/rooms/bookings" element={<RoomList />} />
          <Route path="/rooms/bookings/create" element={<CreateBooking />} />
          <Route path="/rooms/bookings/:roomNumber" element={<BookingDetails />} />
          {/* Legacy redirects */}
          <Route path="/rooms" element={<RoomList />} />
          <Route path="/rooms/create" element={<CreateBooking />} />
          <Route path="/rooms/:roomNumber" element={<BookingDetails />} />
          
          {/* Banquet Routes */}
          <Route path="/banquet" element={<BanquetCalendar />} />
          <Route path="/banquet/create" element={<CreateBanquet />} />
          <Route path="/banquet/:bookingId" element={<BanquetDetails />} />
          
          {/* Menu Routes */}
          <Route path="/menu" element={<MenuList />} />
          <Route path="/menu/add" element={<AddMenuItem />} />
          <Route path="/menu/qr" element={<QRMenuGenerator />} />
          <Route path="/menu/customer" element={<CustomerMenu />} />
          
          {/* Kitchen Routes */}
          <Route path="/kitchen" element={<KitchenOrders />} />
          
          {/* Billing Routes */}
          <Route path="/billing" element={<BillingList />} />
          <Route path="/billing/create" element={<GenerateBill />} />
          
          {/* Inventory Routes */}
          <Route path="/inventory" element={<InventoryDashboard />} />
          <Route path="/inventory/add" element={<AddInventory />} />
          <Route path="/inventory/list" element={<InventoryList />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
