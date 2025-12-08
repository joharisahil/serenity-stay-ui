import { useEffect } from "react";

export default function KotPrint({ order }: any) {

  useEffect(() => {
    setTimeout(() => {
      window.print();       // AUTO PRINT
      window.close();       // CLOSE AFTER PRINTING
    }, 500);
  }, []);

  return (
    <div style={{ padding: "20px", fontSize: "14px", fontFamily: "monospace" }}>
      <h2 style={{ textAlign: "center" }}>KITCHEN ORDER TICKET</h2>
      <hr />

      <p>Order ID: {order._id}</p>
      <p>Table: {order.table_id?.name || "N/A"}</p>
      <p>Time: {new Date(order.createdAt).toLocaleString()}</p>
      <hr />

      <h3>Items</h3>
      {order.items.map((i: any, idx: number) => (
        <p key={idx}>
          {i.qty} × {i.name} ({i.size})
        </p>
      ))}

      <hr />
      <p><strong>Total:</strong> ₹{order.total}</p>
      <hr />
    </div>
  );
}
