import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./userModel";
import { IAirdrop } from "./airdropModel";
import { INetwork } from "./networkModel";
import { IOverview } from "./overviewModel";

export enum Protocol {
    ERC721 = 'ERC-721',
    ERC1155 = 'ERC-1155',
}

export enum Category {
    Art = 'Art',
    Gaming = 'Gaming',
    Memberships = 'Memberships',
    Music = 'Music',
    PFPs = 'PFPs',
    Photography = 'Photography',
}

// 定义 ICollection 接口
export interface ICollection extends Document {
    address: string;
    owner: IUser['_id'];
    logoURI: string;
    name: string;
    symbol: string;
    protocol: Protocol;
    deployedAt: INetwork;
    isBase: boolean;
    category?: Category;
    airdrops: IAirdrop['_id'][];
    previewImages?: string[];
    networks: { networkId: number; networkCollection: string }[];
    baseURI?: string;
    lastFilterBlock: number;
    ipfsGroupId?: string;
    description?: string;
    bannerImageSrc?: string;
    overviews?: IOverview["_id"][];
    createdAt: Date;
    updatedAt: Date;
}

// 创建 collectionSchema
const collectionSchema: Schema<ICollection> = new mongoose.Schema(
    {
        address: { type: String, trim: true, required: true },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        logoURI: { type: String, trim: true, required: true },
        name: { type: String, trim: true, required: true },
        symbol: { type: String, trim: true, required: true },
        protocol: { type: String, enum: Object.values(Protocol), required: true },
        category: { type: String, enum: Object.values(Category), required: false },
        airdrops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Airdrop' }],
        deployedAt: { type: mongoose.Schema.Types.ObjectId, ref: 'Network', required: true },
        isBase: { type: Boolean, required: true },
        previewImages: [{ type: String, required: false }],
        networks: {
            type: [{
                networkId: { type: Number, required: true },
                networkCollection: { type: String, required: true }
            }],
            validate: {
                validator: function (v: any[]) {
                    return v.every(item => item.networkId && item.networkCollection);
                },
                message: 'Each network must have both networkId and networkCollection fields.'
            },
            required: false
        },
        baseURI: { type: String, trim: true, required: false },
        lastFilterBlock: { type: Number, required: true },
        ipfsGroupId: { type: String, required: false, },
        description: { type: String, required: false },
        bannerImageSrc: { type: String, required: false },
        overviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Overview' }],
    },
    {
        timestamps: true,
    }
);

collectionSchema.pre('validate', function (next) {
    if (this.previewImages && this.previewImages.length > 5) {
        return next(new Error('previewImages array must not exceed 5 items.'));
    }
    next();
});

// 创建并导出 Collection 模型
const Collection = mongoose.model<ICollection>("Collection", collectionSchema);

export default Collection;
