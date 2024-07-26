import mongoose, { Document, Schema } from "mongoose";
import { IAirdrop } from "./airdropModel";

// 定义 IHomePage 接口
export interface IHomePage extends Document {
    heroImage: string;
    top5AirdropList: IAirdrop['_id'][];
}

// 创建 homePageSchema
const homePageSchema: Schema<IHomePage> = new mongoose.Schema(
    {
        heroImage: { type: String, trim: true, required: true },
        top5AirdropList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Airdrop", required: true }]
    },
    {
        timestamps: false,
    }
);

// 添加 pre-save 钩子来确保只有一个文档
homePageSchema.pre('save', async function (next) {
    const HomePage = mongoose.model<IHomePage>("HomePage");
    const existingHomePage = await HomePage.findOne({});
    if (existingHomePage && this.isNew) {
        throw new Error("There is already a HomePage document in the database.");
    }
    next();
});

// 创建并导出 HomePage 模型
const HomePage = mongoose.model<IHomePage>("HomePage", homePageSchema);

export default HomePage;
