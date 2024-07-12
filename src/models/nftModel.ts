import mongoose, { Document, mongo, Schema, Types } from "mongoose";
import { ICollection } from "./collectionModel";
import { IUser } from "./userModel";
import { IMarketItem } from "./marketItemModel";

export enum MetadataType {
    Image = 'Image',
    Audio = 'Audio',
    Video = 'Video',
}

// 定义 INFT 接口
export interface INFT extends Document {
    tokenId: string;
    tokenURI?: string;
    amount: string;
    owner: Types.ObjectId | IUser['_id'];
    fromCollection: Types.ObjectId | ICollection['_id'];
    metadataType?: MetadataType;
    latestMarket: Types.ObjectId | IMarketItem['_id'];
    createdAt: Date;
    updatedAt: Date;
}

// 创建 nftSchema
const nftSchema: Schema<INFT> = new mongoose.Schema(
    {
        tokenId: { type: String, required: true },
        tokenURI: { type: String, required: false },
        amount: { type: String, required: true },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        fromCollection: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', required: true },
        metadataType: { type: String, enum: Object.values(MetadataType), required: false },
        latestMarket: { type: mongoose.Schema.Types.ObjectId, ref: "MarketItem", required: false },
    },
    {
        timestamps: true,
    }
);

// 创建并导出 NFT 模型
const NFT = mongoose.model<INFT>("NFT", nftSchema);

export default NFT;
