import { Router } from "express";
import { authUser, getDemoSignMessage, updateUser, updateUserAccess } from "../controller/userController";
import { adminOnly, protect, signatureVerificationMiddleware } from "../middleware/authMiddleware";

const userRouter = Router();

userRouter.post("/login", signatureVerificationMiddleware, authUser)

userRouter.get("/demoSignature/:privateKey", getDemoSignMessage)

userRouter.put("/updateUser", protect, updateUser)

userRouter.put('/updateUserAccess', protect, adminOnly, updateUserAccess)

export default userRouter;