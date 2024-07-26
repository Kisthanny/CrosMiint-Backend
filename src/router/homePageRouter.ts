import { Router } from "express";
import { adminOnly, halfAuth, protect } from "../middleware/authMiddleware";
import { createHomePage, getHomePage, updateHomePage } from "../controller/homePageController";

const homePageRouter = Router();

homePageRouter.post("/createHomePage", protect, adminOnly, createHomePage);

homePageRouter.get("/getHomePage", halfAuth, getHomePage);

homePageRouter.put("/updateHomePage", protect, adminOnly, updateHomePage);

export default homePageRouter;