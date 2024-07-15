import mongoose, { Document, Schema } from "mongoose";

export interface ILog extends Document {
    kind: string;
    content: string;
    createdAt: Date;
}

const logSchema: Schema<ILog> = new mongoose.Schema(
    {
        kind: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now, expires: 604800 }
    },
    {
        timestamps: true,
    }
);

const Log = mongoose.model<ILog>("Log", logSchema);

export default Log;
