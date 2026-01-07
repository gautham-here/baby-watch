import { io } from "socket.io-client";

export function makeSocket() {
  const url = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
  return io(url, { transports: ["websocket"] });
}
