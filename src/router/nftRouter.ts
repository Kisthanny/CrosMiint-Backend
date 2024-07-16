import { Router } from "express";
import { getNFTInfo, getNFTList, getTokenURI } from "../controller/nftController";

const nftRouter = Router();

nftRouter.get("/getTokenURI", getTokenURI);

nftRouter.get("/getNFTList", getNFTList);

nftRouter.get("/getNFTInfo", getNFTInfo);

export default nftRouter;