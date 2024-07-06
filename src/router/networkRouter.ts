import { Router } from "express";
import { adminOnly, protect } from "../middleware/authMiddleware";
import { createNetwork, getNetworks, updateNetwork, deleteNetwork } from "../controller/networkController";

const networkRouter = Router();

networkRouter.post('/createNetwork', protect, adminOnly, createNetwork)

networkRouter.get('/getNetworks', getNetworks)

networkRouter.put('/updateNetwork', protect, adminOnly, updateNetwork)

networkRouter.delete('/deleteNetwork', protect, adminOnly, deleteNetwork)

export default networkRouter;