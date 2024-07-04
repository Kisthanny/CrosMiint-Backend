import mongoose, { Document, Schema } from "mongoose";
import { ICollection } from "./collectionModel";

// 定义 IAirdrop 接口
export interface IAirdrop extends Document {
    fromCollection: ICollection['_id'],
    supply: number;
    minted: number;
    startTime: Date;
    endTime: Date;
    price: number;
    hasWhiteListPhase: boolean;
    whitelistEndTime?: Date;
    whitelistAddresses?: string[];
    whiteListPrice?: number;
    mintLimitPerWallet?: number;
    previewImage?: string;
    createdAt: Date;
    updatedAt: Date;
}

// 创建 airdropSchema
const airdropSchema: Schema<IAirdrop> = new mongoose.Schema(
    {
        fromCollection: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', required: true },
        supply: { type: Number, required: true },
        minted: { type: Number, required: true },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        price: { type: Number, required: true },
        hasWhiteListPhase: { type: Boolean, required: true },
        whitelistEndTime: { type: Date, required: false },
        whitelistAddresses: { type: [String], required: false },
        whiteListPrice: { type: Number, required: false },
        mintLimitPerWallet: { type: Number, required: false },
        previewImage: { type: String, required: false },
    },
    {
        timestamps: true,
    }
);

// Create and export Airdrop model
const Airdrop = mongoose.model<IAirdrop>("Airdrop", airdropSchema);

export default Airdrop;
