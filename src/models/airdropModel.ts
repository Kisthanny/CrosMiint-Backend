import mongoose, { Document, Schema } from "mongoose";
import { ICollection } from "./collectionModel";

// 定义 IAirdrop 接口
export interface IAirdrop extends Document {
    fromCollection: ICollection['_id'],
    dropIndex: string;
    supply: string;
    minted: string;
    startTime: Date;
    endTime: Date;
    price: string;
    hasWhiteListPhase: boolean;
    whiteListEndTime?: Date;
    whiteListPrice?: string;
    mintLimitPerWallet?: string;
    previewImage?: string;
    createdAt: Date;
    updatedAt: Date;
}

// 创建 airdropSchema
const airdropSchema: Schema<IAirdrop> = new mongoose.Schema(
    {
        fromCollection: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', required: true },
        dropIndex: { type: String, required: true },
        supply: { type: String, required: true },
        minted: { type: String, default: '0' },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        price: { type: String, required: true },
        hasWhiteListPhase: { type: Boolean, required: true },
        whiteListEndTime: { type: Date, required: false },
        whiteListPrice: { type: String, required: false },
        mintLimitPerWallet: { type: String, required: false },
        previewImage: { type: String, required: false },
    },
    {
        timestamps: true,
    }
);

// Create and export Airdrop model
const Airdrop = mongoose.model<IAirdrop>("Airdrop", airdropSchema);

export default Airdrop;
