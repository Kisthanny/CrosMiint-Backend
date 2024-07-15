import mongoose, { Document, Schema } from "mongoose";

export interface ITransactionHash extends Document {
    hash: string;
    contractAddress: string;
    createdAt: Date;
}

const TransactionHashSchema = new Schema<ITransactionHash>({
    hash: { type: String, required: true, unique: true },
    contractAddress: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 604800 }  // Expires after 7 days (604800 seconds)
});

const TransactionHash = mongoose.model<ITransactionHash>("TransactionHash", TransactionHashSchema);

export default TransactionHash;
