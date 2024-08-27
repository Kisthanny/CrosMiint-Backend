import mongoose, { Document, Schema } from "mongoose";

export enum OverviewType {
    Text = "Text",
    Image = "Image",
    ImageWithText = "ImageWithText",
}

export enum OverviewPosition {
    TopLeft = "TopLeft",
    topRight = "topRight",
    Left = "Left",
    Center = "Center",
    Right = "Right",
    BottomLeft = "BottomLeft",
    BottomRight = "BottomRight",
}

interface TextBlock {
    title: string;
    description: string;
    position: 0 | 1 | 2;
}

interface ImageBlock {
    imageSrc: string;
}

interface ImageWithTextBlock {
    title: string;
    description: string;
    imageSrc: string;
    position: 1 | 3 | 4 | 5 | 6 | 7 | 9;
}

export interface IOverview extends Document {
    blockType: OverviewType;
    title?: string;
    description?: string;
    imageSrc?: string;
    position?: OverviewPosition;
}

const overviewSchema: Schema<IOverview> = new mongoose.Schema(
    {
        blockType: { type: String, enum: Object.values(OverviewType), required: true },
        title: { type: String },
        description: { type: String },
        imageSrc: { type: String },
        position: { type: String, enum: Object.values(OverviewPosition) },
    },
    { timestamps: false },
);

const Overview = mongoose.model<IOverview>("Overview", overviewSchema);

export default Overview;
