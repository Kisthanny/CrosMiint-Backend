import mongoose, { Document, Schema } from "mongoose";
import { INetwork } from "./networkModel";

// 定义 IMarketplace 接口
export interface IMarketplace extends Document {
    network: INetwork;
    address: string;
    lastFilterBlock: number;
}

// 创建 marketplaceSchema
const marketplaceSchema: Schema<IMarketplace> = new mongoose.Schema(
    {
        network: { type: mongoose.Schema.Types.ObjectId, ref: "Network", required: true, unique: true },
        address: { type: String, required: true, unique: true },
        lastFilterBlock: { type: Number, required: true },
    },
    {
        timestamps: false,
    }
);

// 创建并导出 Marketplace 模型
const Marketplace = mongoose.model<IMarketplace>("Marketplace", marketplaceSchema);

export default Marketplace;
