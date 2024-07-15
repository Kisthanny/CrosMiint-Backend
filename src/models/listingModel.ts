import mongoose, { Document, Schema } from "mongoose";
import { INFT } from "./nftModel";
import { IUser } from "./userModel";
import { INetwork } from "./networkModel";
import { IOffer, offerSchema } from "./OfferModel";


export enum ListingStatus {
    Listed = 'Listed',
    Sold = 'Sold',
    Canceled = 'Canceled',
}

export interface IListing extends Document {
    listingId: string;
    seller: IUser['_id'];
    price: string;
    nft: INFT['_id'];
    status: ListingStatus;
    listAmount: string;
    offers: IOffer[];
    network: INetwork['_id'];
    createdAt: Date;
    updatedAt: Date;
}

const listingSchema: Schema<IListing> = new mongoose.Schema(
    {
        listingId: { type: String, required: true },
        seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        price: { type: String, required: true },
        nft: { type: mongoose.Schema.Types.ObjectId, ref: 'NFT', required: true },
        status: { type: String, enum: Object.values(ListingStatus), required: true },
        listAmount: { type: String, required: true },
        offers: [offerSchema],
        network: { type: mongoose.Schema.Types.ObjectId, ref: "Network", required: true },
    },
    {
        timestamps: true,
    }
);

const Listing = mongoose.model<IListing>("Listing", listingSchema);

export default Listing;
