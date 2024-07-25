import { Response, NextFunction } from 'express';
import { ValidatedRequest } from './authMiddleware';
import fs from 'fs';
export const uploadPathMiddleware = async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    const uploadPath = `uploads/${req.user?._id}`;

    // 检查目录是否存在
    fs.access(uploadPath, fs.constants.F_OK, (err) => {
        if (!err) {
            // 如果目录存在，返回错误
            res.status(409);
            next(new Error('User already has an ongoing upload task.'))
        }

        // 如果目录不存在，创建目录
        fs.mkdir(uploadPath, { recursive: true }, (err) => {
            if (err) {
                next(err);
            }
            next();
        });
    });
};