import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { createAirdrop, getAirdropList } from "../controller/airdropController";

const airdropRouter = Router();

airdropRouter.post("/createAirdrop", protect, createAirdrop);

airdropRouter.get("/getAirdropList", getAirdropList);

export default airdropRouter;