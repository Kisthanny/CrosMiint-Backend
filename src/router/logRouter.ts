import { Router } from "express";
import { getLogs } from "../controller/logController";
import { adminOnly, protect } from "../middleware/authMiddleware";

const logRouter = Router();

logRouter.get("/getLogs", protect, adminOnly, getLogs);

export default logRouter;