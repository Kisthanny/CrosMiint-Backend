import { Router } from "express";
import { authUser, getDemoSignMessage, updateUser } from "../controller/userControllers";
import { protect, signatureVerificationMiddleware } from "../middleware/authMiddleware";

const userRouter = Router();

userRouter.post("/login", signatureVerificationMiddleware, authUser)

userRouter.get("/demoSignature", getDemoSignMessage)

userRouter.put("/updateUser", protect, updateUser)

export default userRouter;