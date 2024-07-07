import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { createCollection, getCollections, updateCategory } from "../controller/collectionController";

const collectionRouter = Router();

collectionRouter.post("/createCollection", protect, createCollection);

collectionRouter.get("/getCollections", getCollections);

collectionRouter.put("/updateCategory", protect, updateCategory);

export default collectionRouter;