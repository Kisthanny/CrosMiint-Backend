import { Router } from "express";
import { authUser, getDemoSignMessage, getUserInfo, updateProfileCover, updateUser, updateUserAccess } from "../controller/userController";
import { adminOnly, protect, signatureVerificationMiddleware } from "../middleware/authMiddleware";

const userRouter = Router();

userRouter.post("/login", signatureVerificationMiddleware, authUser)

userRouter.get("/demoSignature/:privateKey", getDemoSignMessage)

userRouter.put("/updateUser", protect, updateUser)

userRouter.put('/updateUserAccess', protect, adminOnly, updateUserAccess)

userRouter.put("/updateProfileCover", protect, updateProfileCover);

userRouter.get("/getUserInfo", getUserInfo);

export default userRouter;