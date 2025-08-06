import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import presentationRoutes from "./routes/presentationRoutes";
import { setupSocketHandlers } from "./sockets/presentationSocket";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"],
  },
});

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/presentation")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/presentations", presentationRoutes);
app.get("/", (req, res) => {
  res.json({ message: "Presentation API is running!" });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  setupSocketHandlers(io, socket);

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.POT || 3001;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
