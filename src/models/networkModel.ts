import mongoose, { Document, Schema } from "mongoose";

// 定义 INetwork 接口
export interface INetwork extends Document {
    networkId: number;
    chainName: string;
    chainId: string;
    gateway: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrls?: string[];
    blockExplorerUrls?: string[];
}

// 创建 networkSchema
const networkSchema: Schema<INetwork> = new mongoose.Schema(
    {
        networkId: { type: Number, required: true },
        chainName: { type: String, required: true },
        chainId: { type: String, required: true },
        gateway: { type: String, required: true },
        nativeCurrency: {
            name: { type: String, required: true },
            symbol: { type: String, required: true },
            decimals: { type: Number, required: true },
        },
        rpcUrls: [{ type: String, required: false }],
        blockExplorerUrls: [{ type: String, required: false }],
    },
    {
        timestamps: false,
    }
);

// 创建并导出 Network 模型
const Network = mongoose.model<INetwork>("Network", networkSchema);

export default Network;
