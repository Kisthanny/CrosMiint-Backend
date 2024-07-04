import mongoose, { Document, Schema } from "mongoose";
import { INFT } from "./nftModel";
import { IUser } from "./userModel";

export enum MarketItemStatus {
    Listed = 'Listed',
    Sold = 'Sold',
    Canceled = 'Canceled',
}

export interface IOffer extends Document {
    user: IUser['_id'];
    price: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMarketItem extends Document {
    seller: IUser['_id'];
    price: Number;
    nft: INFT['_id'];
    listedAt: Date;
    listEndDate?: Date;
    status: MarketItemStatus;
    listAmount?: Number;
    offers?: IOffer[];
    createdAt: Date;
    updatedAt: Date;
}

const offerSchema: Schema<IOffer> = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        price: { type: Number, required: true },
    },
    {
        timestamps: true,
    }
);

const marketItemSchema: Schema<IMarketItem> = new mongoose.Schema(
    {
        seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        price: { type: Number, required: true },
        nft: { type: mongoose.Schema.Types.ObjectId, ref: 'NFT', required: true },
        listedAt: { type: Date, default: Date.now },
        listEndDate: { type: Date, required: false },
        status: { type: String, enum: Object.values(MarketItemStatus), required: true },
        listAmount: { type: Number, required: false },
        offers: [offerSchema],
    },
    {
        timestamps: true,
    }
);

const MarketItem = mongoose.model<IMarketItem>("MarketItem", marketItemSchema);

export default MarketItem;
