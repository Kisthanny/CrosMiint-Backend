import { Router } from "express";
import { adminOnly, protect } from "../middleware/authMiddleware";
import { allCollectionUpToDate, createCategory, createCollection, getCategoryList, getCollectionInfo, getCollections, updateCollection } from "../controller/collectionController";

const collectionRouter = Router();

collectionRouter.post("/createCollection", protect, createCollection);

collectionRouter.get("/getCollections", getCollections);

collectionRouter.get("/getCollectionInfo", getCollectionInfo);

collectionRouter.put("/updateCollection", protect, updateCollection);

collectionRouter.put("/allCollectionUpToDate", protect, adminOnly, allCollectionUpToDate);

collectionRouter.post("/createCategory", protect, adminOnly, createCategory);

collectionRouter.get("/getCategoryList", getCategoryList);

export default collectionRouter;