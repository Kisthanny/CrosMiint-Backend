import { Router } from "express";
import { getListingInfo, getListings } from "../controller/listingController";

const listingRouter = Router();

listingRouter.get("/getListings", getListings);

listingRouter.get("/getListingInfo", getListingInfo);

export default listingRouter;