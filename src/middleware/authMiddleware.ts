import { Request, Response, NextFunction } from "express";
import { verify, JwtPayload } from "jsonwebtoken";
import User, { IUser, Role } from "../models/userModel"; // 确保路径正确
import expressAsyncHandler from "express-async-handler";
import { ethers } from "ethers";

// 扩展 Request 接口
export interface ValidatedRequest extends Request {
    user?: IUser;
    signatureVerified?: boolean;
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

// for interface that do not require but could accept authentication
export const halfAuth = expressAsyncHandler(async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    let token: string = "";

    if (req.headers.authorization?.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;

            const user = await User.findById(decoded.id);

            if (!user) {
                throw new Error("Not Authorized, user not found");
            }

            req.user = user; // 设置 req.user

            next();
        } catch (error) {
            next();
        }
    } else {
        next();
    }
});

export const signatureVerificationMiddleware = expressAsyncHandler(async (req: ValidatedRequest, res, next) => {
    try {
        const { signature, address } = req.body;

        // 验证签名
        const recoveredAddress = ethers.verifyMessage(
            process.env.SIGN_MESSAGE!,
            signature
        );

        // 将用户的地址转换为以太坊地址格式
        const formattedAddress = ethers.getAddress(address);

        // 验证签名是否成功
        if (recoveredAddress.toLocaleLowerCase() !== formattedAddress.toLocaleLowerCase()) {
            throw new Error("Recovered address does not match provided address");
        }

        // // 签名验证成功，将验证结果存储到请求对象中
        req.signatureVerified = true;

        // 继续请求处理
        next();
    } catch (error) {
        // 签名验证失败，返回错误响应
        console.error("Signature verification failed:", error);
        res.status(401).json({ error: "Unauthorized" });
    }
})

export const adminOnly = expressAsyncHandler(async (req: ValidatedRequest, res, next) => {
    const role = req.user?.role;
    if (role !== Role.Admin) {
        res.status(401).json({ error: 'Access Denied' })
    } else {
        next();
    }
})
