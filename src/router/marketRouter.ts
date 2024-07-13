import { Router } from "express";
import { adminOnly, protect } from "../middleware/authMiddleware";
import { createMarketplace, getListingList, getMarketplaceList, updateMarketplace } from "../controller/marketController";

const marketRouter = Router();

marketRouter.post("/createMarketplace", protect, adminOnly, createMarketplace);

marketRouter.put("/updateMarketplace", protect, adminOnly, updateMarketplace);

marketRouter.get("/getMarketplaceList", getMarketplaceList);

marketRouter.get("/getListingList", getListingList);

export default marketRouter;