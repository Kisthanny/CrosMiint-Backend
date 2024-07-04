import mongoose, { Document, Schema } from "mongoose";
import { INFT } from "./nftModel";
import { IUser } from "./userModel";

export enum AuctionStatus {
    Active = 'Active',
    Ended = 'Ended',
    Canceled = 'Canceled',
}

export interface IBid extends Document {
    user: IUser['_id'];
    price: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAuction extends Document {
    seller: IUser['_id'];
    startingPrice: number;
    nft: INFT['_id'];
    startTime: Date;
    endTime: Date;
    status: AuctionStatus;
    bids?: IBid[];
    createdAt: Date;
    updatedAt: Date;
}

const bidSchema: Schema<IBid> = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        price: { type: Number, required: true },
    },
    {
        timestamps: true,
    }
);

const auctionSchema: Schema<IAuction> = new mongoose.Schema(
    {
        seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        startingPrice: { type: Number, required: true },
        nft: { type: mongoose.Schema.Types.ObjectId, ref: 'NFT', required: true },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        status: { type: String, enum: Object.values(AuctionStatus), required: true },
        bids: [bidSchema],
    },
    {
        timestamps: true,
    }
);

const Auction = mongoose.model<IAuction>("Auction", auctionSchema);

export default Auction;
