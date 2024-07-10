import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { createCollection, getCollections, updateCategory, updatePreviewImage } from "../controller/collectionController";

const collectionRouter = Router();

collectionRouter.post("/createCollection", protect, createCollection);

collectionRouter.get("/getCollections", getCollections);

collectionRouter.put("/updateCategory", protect, updateCategory);

collectionRouter.put("/updatePreviewImage", protect, updatePreviewImage);

export default collectionRouter;