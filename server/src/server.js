import express from "express";
import dotenv from "dotenv";
import connectDb from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { createServer } from "http";
import { initSocket } from "./lib/socket.js"; // 👈 use refactored socket

dotenv.config();

const app = express();
const server = createServer(app); // 👈 create server once

await connectDb();

app.use(express.json({ limit: "10mb" }));  
app.use(express.urlencoded({ extended: true, limit: "10mb" }));  
app.use(cookieParser());
app.use(
    cors({
        origin: "https://ajay-chat.onrender.com", // frontend production url
        credentials: true,
    })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 3000;

// 👇 attach socket.io to same server
initSocket(server);

server.listen(PORT, () =>
    console.log(`🚀 Server & Socket running on: http://localhost:${PORT}`)
);
