import mongoose, { Document, Schema, Types } from "mongoose";
import { ICollection } from "./collectionModel";
import { INFT } from "./nftModel";
import { IUser } from "./userModel";

enum TransferStage {
    Created = 'Created',
    GasDeposited = 'GasDeposited',
    BurntAndSent = 'BurntAndSent',
    Recieved = 'Recieved',
}

export interface ITransferRecord extends Document {
    sourceCollection: ICollection['_id'];
    destinationCollection: ICollection['_id'];
    sourceNFT: INFT['_id'];
    sourceHolder: IUser['_id'];
    destinationHolder: string;
    stage: TransferStage;
    submitMessageHash?: string;
    createdAt: Date;
    updatedAt: Date;
}

const transferRecordSchema: Schema<ITransferRecord> = new mongoose.Schema(
    {
        sourceCollection: { type: mongoose.Schema.Types.ObjectId, ref: "Collection", required: true },
        destinationCollection: { type: mongoose.Schema.Types.ObjectId, ref: "Collection", required: true },
        sourceNFT: { type: mongoose.Schema.Types.ObjectId, ref: "NFT", required: true },
        sourceHolder: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        destinationHolder: { type: String, required: true },
        stage: { type: String, enum: Object.values(TransferStage), required: true },
        submitMessageHash: { type: String, required: false }
    },
    {
        timestamps: true,
    }
);

const TransferRecord = mongoose.model<ITransferRecord>("TransferRecord", transferRecordSchema);

export default TransferRecord;
