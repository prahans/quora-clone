import "dotenv/config";
import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import postRouter from "./routes/postRoutes.ts";
import authRouter from "./routes/authRoutes.ts";
import connectDB from "./config/db.ts";

const app: Express = express();

app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

const PORT = process.env.PORT || 3000;

app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
