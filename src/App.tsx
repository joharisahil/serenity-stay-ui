import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RoomList from "./pages/rooms/RoomList";

import ManageRooms from "./pages/rooms/ManageRooms";



//import CreateBooking from "./pages/rooms/CreateBooking";

import CreateBooking from "./pages/rooms/CreateBooking/CreateBooking";
import RoomCalendar from "./pages/rooms/RoomPanel/RoomCalendar";

import BookingDetails from "./pages/rooms/BookingDetails/BookingDetails";
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
import ViewRoomDetails from "./pages/rooms/ViewRoomDetails";
import EditRoomPage from "./pages/rooms/EditRoomPage";
import ManageTables from "./pages/tables/ManageTables";
import EditTablePage from "./pages/tables/EditTablePage";
import ViewTableDetails from "./pages/tables/ViewTableDetails";
import EditCategoriesPage from "./pages/menu/EditCategory";
import OldBillsList from "./pages/billing/OldBillsList";
import ViewBillPage from "./pages/billing/ViewBillPage";
import RoomBillingList from "./pages/billing/RoomBillingList";
import CreateRestaurantBill from "./pages/billing/CreateRestaurantBill";
import Halls from "./pages/banquet/Halls";
import Plans from "./pages/banquet/Plans";
import ProformaInvoice from "./pages/banquet/ProformaInvoice";
import FinalInvoice from "./pages/banquet/FinalInvoice";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>

            {/* Public Route */}
            {/* <Route path="/" element={<Login />} /> */}
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Actual login page */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            {/* Room Routes */}
            <Route path="/rooms/manage" element={
              <ProtectedRoute><ManageRooms /></ProtectedRoute>} />
            <Route
              path="/rooms/view/:id"
              element={
                <ProtectedRoute>
                  <ViewRoomDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rooms/edit/:id"
              element={
                <ProtectedRoute>
                  <EditRoomPage />
                </ProtectedRoute>
              }
            />

            <Route path="/rooms/bookings" element={<ProtectedRoute><RoomCalendar /></ProtectedRoute>} />
            <Route path="/rooms/bookings/create" element={<ProtectedRoute><CreateBooking /></ProtectedRoute>} />
            {/* <Route path="/rooms/bookings/:roomNumber" element={<ProtectedRoute><BookingDetails /></ProtectedRoute>} /> */}
            {/* Legacy redirects */}
            <Route path="/rooms" element={<ProtectedRoute><RoomCalendar /></ProtectedRoute>} />
            {/* <Route path="/rooms//bookings/create" element={<ProtectedRoute><CreateBooking /></ProtectedRoute>} /> */}
            <Route path="/rooms/bookings/:roomId" element={<ProtectedRoute><BookingDetails /></ProtectedRoute>} />
            <Route path="/rooms/bills" element={<ProtectedRoute><RoomBillingList /></ProtectedRoute>} />
            {/* Room Routes
            <Route path="/rooms" element={
              <ProtectedRoute><RoomList /></ProtectedRoute>
            } />

            <Route path="/rooms/create" element={
              <ProtectedRoute><CreateBooking /></ProtectedRoute>
            } />

            <Route path="/rooms/:roomNumber" element={
              <ProtectedRoute><BookingDetails /></ProtectedRoute>
            } /> */}

            {/* Table Routes */}
            <Route path="/tables/manage" element={
              <ProtectedRoute><ManageTables /></ProtectedRoute>} />
            <Route
              path="/tables/view/:id"
              element={
                <ProtectedRoute>
                  <ViewTableDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tables/edit/:id"
              element={
                <ProtectedRoute>
                  <EditTablePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/menu/category/edit"
              element={
                <ProtectedRoute>
                  <EditCategoriesPage />
                </ProtectedRoute>
              }
            />


            {/* Banquet Routes */}
            <Route path="/banquet" element={
              <ProtectedRoute><BanquetCalendar /></ProtectedRoute>
            } />

            <Route path="/banquet/create" element={
              <ProtectedRoute><CreateBanquet /></ProtectedRoute>
            } />

            <Route path="/banquet/:bookingId" element={
              <ProtectedRoute><BanquetDetails /></ProtectedRoute>
            } />

            <Route path="/banquet/halls" element={
             <ProtectedRoute><Halls /></ProtectedRoute>
            } />

            <Route path="/banquet/plans" element={
             <ProtectedRoute><Plans /></ProtectedRoute> 
            } />

            <Route path="/banquet/:bookingId/proforma" element={
              <ProtectedRoute><ProformaInvoice /></ProtectedRoute>
            } />
            <Route path="/banquet/:id/invoice" element={ 
              <ProtectedRoute><FinalInvoice /></ProtectedRoute>
            } />

            {/* Menu Routes */}
            <Route path="/menu" element={
              <ProtectedRoute><MenuList /></ProtectedRoute>
            } />

            <Route path="/menu/add" element={
              <ProtectedRoute><AddMenuItem /></ProtectedRoute>
            } />

            <Route path="/menu/qr" element={
              <ProtectedRoute><QRMenuGenerator /></ProtectedRoute>
            } />

            <Route path="/menu/qr/:source/:id/:hotelId" element={
              <CustomerMenu />
            } />

            {/* Kitchen Routes */}
            <Route path="/kitchen" element={
              <ProtectedRoute><KitchenOrders /></ProtectedRoute>
            } />

            {/* Billing Routes */}
            <Route path="/billing" element={
              <ProtectedRoute><BillingList /></ProtectedRoute>
            } />
            <Route path="/billing/restaurant/create" element={
              <ProtectedRoute><CreateRestaurantBill /></ProtectedRoute>
            } />
            <Route path="/billing/restaurant/:tableId" element={
              <ProtectedRoute><GenerateBill /></ProtectedRoute>
            } />
            <Route path="/old-bills" element={ 
              <ProtectedRoute><OldBillsList /></ProtectedRoute>
            } />
            <Route path="/view/:type/:billId" element={
              <ProtectedRoute><ViewBillPage /></ProtectedRoute>
            } />

            {/* Inventory Routes */}
            <Route path="/inventory" element={
              <ProtectedRoute><InventoryDashboard /></ProtectedRoute>
            } />

            <Route path="/inventory/add" element={
              <ProtectedRoute><AddInventory /></ProtectedRoute>
            } />

            <Route path="/inventory/list" element={
              <ProtectedRoute><InventoryList /></ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />

          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
