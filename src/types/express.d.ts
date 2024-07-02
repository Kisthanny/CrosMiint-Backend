import { IUser } from "../models/userModel"; // 确保路径正确

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}
