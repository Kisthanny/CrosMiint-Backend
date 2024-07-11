import { Router } from "express";
import { adminOnly, protect } from "../middleware/authMiddleware";
import { createListing, createMarketplace, getListingList, getMarketplaceList, offerMade, updateMarketplace } from "../controller/marketController";

const marketRouter = Router();

marketRouter.post("/createMarketplace", protect, adminOnly, createMarketplace);

marketRouter.put("/updateMarketplace", protect, adminOnly, updateMarketplace);

marketRouter.get("/getMarketplaceList", getMarketplaceList);

marketRouter.post("/createListing", protect, createListing);

marketRouter.get("/getListingList", getListingList);

marketRouter.post("/offerMade", protect, offerMade);

export default marketRouter;