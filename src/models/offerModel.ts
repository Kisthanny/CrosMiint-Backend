import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./userModel";
import { IListing } from "./listingModel";

export interface IOffer extends Document {
    offerIndex: string;
    offerer: IUser['_id'];
    price: string;
    amount: string;
    accepted: boolean;
    fromListing: IListing;
    createdAt: Date;
    updatedAt: Date;
}

export const offerSchema: Schema<IOffer> = new mongoose.Schema(
    {
        offerIndex: { type: String, required: true },
        offerer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        price: { type: String, required: true },
        amount: { type: String, required: true },
        accepted: { type: Boolean, default: false },
        fromListing: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
    {
        timestamps: true,
    }
);

export const Offer = mongoose.model<IOffer>("Offer", offerSchema);

export default Offer;
