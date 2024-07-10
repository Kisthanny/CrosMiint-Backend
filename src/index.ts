import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import userRouter from "./router/userRouter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import networkRouter from "./router/networkRouter";
import collectionRouter from "./router/collectionRouter";
import airdropRouter from "./router/airdropRouter";
import nftRouter from "./router/nftRouter";

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

// use router
app.use("/api/user", userRouter);
app.use("/api/network", networkRouter);
app.use("/api/collection", collectionRouter);
app.use("/api/airdrop", airdropRouter);
app.use("/api/nft", nftRouter);

// error handle
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`)
})

export default server