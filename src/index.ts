import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";

dotenv.config();

connectDB();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_HOST, // 你的前端域名
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is up and running");
});