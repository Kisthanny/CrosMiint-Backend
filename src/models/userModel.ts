import mongoose, { Document, Schema } from "mongoose";

// 定义 IUser 接口
export interface IUser extends Document {
    address: string;
    name?: string;
    avatar?: string;
    bio?: string;
    email?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    createdAt: Date;
    updatedAt: Date;
}

// 创建 userSchema
const userSchema: Schema<IUser> = new mongoose.Schema(
    {
        address: { type: String, trim: true, unique: true, required: true },
        name: { type: String, trim: true, unique: true, required: false },
        avatar: { type: String, trim: true, unique: true, required: false },
        bio: { type: String, trim: true, unique: true, required: false },
        email: { type: String, trim: true, unique: true, required: false },
        facebook: { type: String, trim: true, unique: true, required: false },
        twitter: { type: String, trim: true, unique: true, required: false },
        instagram: { type: String, trim: true, unique: true, required: false },
    },
    {
        timestamps: true,
    }
);

// 创建并导出 User 模型
const User = mongoose.model<IUser>("User", userSchema);

export default User;
