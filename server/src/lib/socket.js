import { Server } from "socket.io";

// used to store online users
const userSocketMap = {}; // { userId: socketId }
let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "https://ajay-chat.onrender.com", // ✅ allow only your frontend
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;

    // Send list of online users to all clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });
}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}
