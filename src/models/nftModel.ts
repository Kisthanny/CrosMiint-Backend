import mongoose, { Document, Schema, Types } from "mongoose";
import { ICollection } from "./collectionModel";
import { IUser } from "./userModel";
import { IListing } from "./ListingModel";

export enum MetadataType {
    Image = 'Image',
    Audio = 'Audio',
    Video = 'Video',
}

// Define the sub-document schema for owners
interface ITokenOwner {
    owner: IUser['_id'];
    amount: string;
}

const tokenOwnerSchema: Schema<ITokenOwner> = new mongoose.Schema(
    {
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: String, required: true },
    },
    { _id: false } // Disable the _id field for sub-documents
);

// Define INFT interface
export interface INFT extends Document {
    tokenId: string;
    tokenURI?: string;
    owners: ITokenOwner[];
    fromCollection: ICollection['_id'];
    metadataType?: MetadataType;
    latestMarket: IListing['_id'];
    createdAt: Date;
    updatedAt: Date;
}

// Create nftSchema
const nftSchema: Schema<INFT> = new mongoose.Schema(
    {
        tokenId: { type: String, required: true },
        tokenURI: { type: String, required: false },
        owners: { type: [tokenOwnerSchema], required: true },
        fromCollection: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', required: true },
        metadataType: { type: String, enum: Object.values(MetadataType), required: false },
        latestMarket: { type: mongoose.Schema.Types.ObjectId, ref: "MarketItem", required: false },
    },
    {
        timestamps: true,
    }
);

// Create and export NFT model
const NFT = mongoose.model<INFT>("NFT", nftSchema);

export default NFT;
