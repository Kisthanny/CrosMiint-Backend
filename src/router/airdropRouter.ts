import { Router } from "express";
import { getAirdropInfo, getAirdropList } from "../controller/airdropController";

const airdropRouter = Router();

airdropRouter.get("/getAirdropList", getAirdropList);

airdropRouter.get("/getAirdropInfo", getAirdropInfo);

export default airdropRouter;