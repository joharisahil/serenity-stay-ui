export interface GuestId {
  type: string;
  idNumber: string;
  nameOnId: string;
}

export interface AddedService {
  name: string;
  price: number;
  days: number[];
  gstEnabled: boolean;
}

export interface Hotel {
  _id: string;
  name?: string;
}

export interface RoomOrderSummary {
  subtotal: number;
  discountAmount: number;
  gst: number;
  total: number;
  gstEnabled: boolean;
}

export interface RoomPlan {
  code: string;
  singlePrice: number;
  doublePrice: number;
}

export interface Room {
  _id: string;
  number: string;
  type: string;
  baseRate?: number; // ⚡ Add this
  plans?: RoomPlan[];
}

export interface Advance {
  _id?: string;
  amount: number;
  mode: string;
  date: string;
  note?: string;
}

export interface FoodTotals {
  subtotal: number;
  gst: number;
  total: number;
}

export interface OrderItem {
  name: string;
  qty: number;
  totalPrice: number;
}

export interface RoomOrder {
  _id: string;
  items: OrderItem[];
  subtotal: number;
  gst: number;
  total: number;
  createdAt: string;
}

export interface Booking {
  _id: string;
  hotel_id: string;
  room_id: Room;

  guestName: string;
  guestPhone: string;
  guestCity?: string;
  guestNationality?: string;
  guestAddress?: string;

  adults: number;
  children: number;

  checkIn: string;
  checkOut: string;

  planCode?: string;
  pricingType?: "BASE_EXCLUSIVE" | "FINAL_INCLUSIVE";
  finalRoomPrice?: number;
  gstEnabled: boolean;
  foodGSTEnabled: boolean;
  roundOffEnabled: boolean;
  roundOffAmount?: number;

  discount?: number;
  foodDiscount?: number;
  discountAmount?: number;   // ✅ ADD THIS
  discountScope?: "TOTAL" | "ROOM" | "EXTRAS"; // ✅ OPTIONAL BUT RECOMMENDED
  taxable?: number;
  cgst?: number;
  sgst?: number;

  foodTotals?: FoodTotals;

  addedServices?: AddedService[];
  guestIds?: GuestId[];

  companyName?: string;
  companyGSTIN?: string;
  companyAddress?: string;

  status?: string;

  advances: Advance[];
  advancePaid: number;
  balanceDue: number;

  finalPaymentReceived?: boolean;
  finalPaymentMode?: string;
  finalPaymentAmount?: number;

  // ⚡ Backend-calculated fields
  nights?: number;
  roomStayTotal?: number;
  extrasBase?: number;
  extrasGST?: number;
  extrasTotal?: number;
  grandTotal?: number;

    // ⚡ Add this property
  billing?: BillingData;  
}

export interface BillingData {
  nights: number;
  roomPrice: number;
  roomStayTotal: number;
  extrasBase: number;
  extrasGST: number;
  extrasTotal: number;
  taxable: number;
  cgst: number;
  sgst: number;
  foodTotals: FoodTotals;
  advancePaid: number;
  balanceDue: number;
  roundOffAmount: number;
  roundOffEnabled: boolean;
  grandTotal: number;
}
