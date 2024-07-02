import mongoose, { Document, Schema } from "mongoose";

// 定义 IUser 接口
export interface IUser extends Document {
    address: string;
    createdAt: Date;
    updatedAt: Date;
}

// 创建 userSchema
const userSchema: Schema<IUser> = new mongoose.Schema(
    {
        address: { type: String, trim: true, unique: true, required: true },
    },
    {
        timestamps: true,
    }
);

// 创建并导出 User 模型
const User = mongoose.model<IUser>("User", userSchema);

export default User;
