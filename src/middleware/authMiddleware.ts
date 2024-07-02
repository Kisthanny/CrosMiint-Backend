import { Request, Response, NextFunction } from "express";
import { verify, JwtPayload } from "jsonwebtoken";
import User, { IUser } from "../models/userModel"; // 确保路径正确
import expressAsyncHandler from "express-async-handler";

// 扩展 Request 接口
interface ValidatedRequest extends Request {
    user?: IUser;
}

export const protect = expressAsyncHandler(async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    let token: string = "";

    if (req.headers.authorization?.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;

            const user = await User.findById(decoded.id);

            if (!user) {
                res.status(401);
                throw new Error("Not Authorized, user not found");
            }

            req.user = user; // 设置 req.user

            next();
        } catch (error) {
            res.status(401);
            throw new Error("Not Authorized, token failed");
        }
    } else {
        res.status(401);
        throw new Error("Not Authorized, no token");
    }
});
