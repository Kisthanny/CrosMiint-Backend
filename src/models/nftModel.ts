import mongoose, { Document, Schema, Types } from "mongoose";
import { ICollection } from "./collectionModel";
import { IUser } from "./userModel";

export enum MetadataType {
    Image = 'Image',
    Audio = 'Audio',
    Video = 'Video',
}

// 定义 INFT 接口
export interface INFT extends Document {
    tokenId: string;
    tokenURI: string;
    amount: number;
    owner: Types.ObjectId | IUser['_id'];
    creator: Types.ObjectId | IUser['_id'];
    fromCollection: Types.ObjectId | ICollection['_id'];
    metadataType: MetadataType;
    blockchainId: number;
    createdAt: Date;
    updatedAt: Date;
}

// 创建 nftSchema
const nftSchema: Schema<INFT> = new mongoose.Schema(
    {
        tokenId: { type: String, required: true },
        tokenURI: { type: String, required: true },
        amount: { type: Number, required: true, default: 1 },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        fromCollection: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', required: true },
        metadataType: { type: String, enum: Object.values(MetadataType), required: true },
        blockchainId: { type: Number, required: true },
    },
    {
        timestamps: true,
    }
);

// 创建并导出 NFT 模型
const NFT = mongoose.model<INFT>("NFT", nftSchema);

export default NFT;
