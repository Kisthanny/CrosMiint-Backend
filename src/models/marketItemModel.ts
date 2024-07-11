import mongoose, { Document, Schema } from "mongoose";
import { INFT } from "./nftModel";
import { IUser } from "./userModel";
import { INetwork } from "./networkModel";

export enum MarketItemStatus {
    Listed = 'Listed',
    Sold = 'Sold',
    Canceled = 'Canceled',
}

export interface IOffer extends Document {
    offerIndex: string;
    user: IUser['_id'];
    price: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMarketItem extends Document {
    seller: IUser['_id'];
    price: string;
    nft: INFT['_id'];
    status: MarketItemStatus;
    listAmount: string;
    offers: IOffer[];
    network: INetwork['_id'];
    listingId: string;
    createdAt: Date;
    updatedAt: Date;
}

const offerSchema: Schema<IOffer> = new mongoose.Schema(
    {
        offerIndex: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        price: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

const marketItemSchema: Schema<IMarketItem> = new mongoose.Schema(
    {
        seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        price: { type: String, required: true },
        nft: { type: mongoose.Schema.Types.ObjectId, ref: 'NFT', required: true },
        status: { type: String, enum: Object.values(MarketItemStatus), required: true },
        listAmount: { type: String, required: true },
        offers: [offerSchema],
        network: { type: mongoose.Schema.Types.ObjectId, ref: "Network", required: true },
        listingId: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

const MarketItem = mongoose.model<IMarketItem>("MarketItem", marketItemSchema);

export const Offer = mongoose.model<IOffer>("Offer", offerSchema);

export default MarketItem;
