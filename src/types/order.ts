export interface OrderItem {
  item_id: string;
  name: string;
  size: string;
  qty: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface Order {
  _id: string;
  hotel_id: string;
  source: string;
  table_id?: string;
  room_id?: string;
  subtotal: number;
  gst: number;
  total: number;
  status: string;
  items: OrderItem[];
}

export interface OrderCreatedEvent {
  order: Order;
  kot: any; // optional
}
