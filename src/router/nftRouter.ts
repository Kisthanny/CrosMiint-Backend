import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { create721Token, getNFTList, getTokenURI } from "../controller/nftController";

const nftRouter = Router();

nftRouter.post("/create721Token", protect, create721Token);

nftRouter.get("/getTokenURI", getTokenURI);

nftRouter.get("/getNFTList", getNFTList);

export default nftRouter;