import mongoose, { Document, Schema } from "mongoose";

export enum CategoryName {
    Art = 'Art',
    Gaming = 'Gaming',
    Memberships = 'Memberships',
    Music = 'Music',
    PFPs = 'PFPs',
    Photography = 'Photography',
}

export interface ICategory extends Document {
    name: string;
    image: string;
}

const categorySchema: Schema<ICategory> = new mongoose.Schema(
    {
        name: { type: String, enum: Object.values(CategoryName), required: true, unique: true },
        image: { type: String, required: true, unique: true },
    },
    {
        timestamps: false,
    }
);

const Category = mongoose.model<ICategory>("Category", categorySchema);

export default Category;
