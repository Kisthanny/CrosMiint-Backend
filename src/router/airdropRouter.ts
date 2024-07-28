import { Router } from "express";
import { getAirdropInfo, getAirdropList, getTop5AirdropList, likeAirdrop, unlikeAirdrop } from "../controller/airdropController";
import { halfAuth, protect } from "../middleware/authMiddleware";

const airdropRouter = Router();

airdropRouter.get("/getAirdropList", halfAuth, getAirdropList);

airdropRouter.get("/getAirdropInfo", getAirdropInfo);

airdropRouter.post("/likeAirdrop", protect, likeAirdrop);

airdropRouter.post("/unlikeAirdrop", protect, unlikeAirdrop);

airdropRouter.get("/getTop5AirdropList", halfAuth, getTop5AirdropList);

export default airdropRouter;