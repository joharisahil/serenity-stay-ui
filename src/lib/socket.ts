import io from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL.replace("/api/v1", "");

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 15,
});
socket.on("connect", () => {
  console.log("SOCKET CONNECTED:", socket.id);

  // Restore previous room & role
  const hotelId = localStorage.getItem("hotelId");
  const role = localStorage.getItem("role"); // <-- store role in localStorage

  if (hotelId && role) {
    console.log("Rejoining room:", hotelId, role);
    socket.emit("join_hotel_room", { hotelId, role });
  }
});
socket.on("connect", () => {
  console.log("SOCKET CONNECTED:", socket.id);

  // Restore previous room & role
  const hotelId = localStorage.getItem("hotelId");
  const role = localStorage.getItem("role"); // <-- store role in localStorage

  if (hotelId && role) {
    console.log("Rejoining room:", hotelId, role);
    socket.emit("join_hotel_room", { hotelId, role });
  }
});

// Debug logs
socket.on("connect", () => {
  console.log("SOCKET CONNECTED:", socket.id);
});

socket.on("disconnect", () => {
  console.log("SOCKET DISCONNECTED");
});

export const joinHotelRoom = (hotelId: string, role?: string) => {
  console.log("JOINING ROOM:", hotelId, role);
  socket.emit("join_hotel_room", { hotelId, role });
};
