import { Document } from 'mongoose';
import { IUser } from "../models/userModel";

export const formatDocument = (docs: Document | Document[]) => {
    const formatSingleDocument = (doc: Document) => {
        return doc.toObject({
            versionKey: false,
            transform: function (doc, ret) {
                ret.id = ret._id;
                delete ret._id;
                return ret;
            }
        });
    };

    if (Array.isArray(docs)) {
        return docs.map(formatSingleDocument);
    } else {
        return formatSingleDocument(docs);
    }
};

// convert all likes array to likeCount: number and isLiked: boolean
export const formatLikes = (docs: any | any[], user: IUser | undefined) => {
    const formatSingleDocument = (doc: any) => {
        const duplica = { ...doc };
        if (Array.isArray(doc.likes)) {
            duplica.likeCount = doc.likes.length;
            const userId = String(user?._id)
            const likes = doc.likes.map((id: any) => String(id));
            const isLiked = likes.includes(userId)
            duplica.isLiked = isLiked;
            delete duplica.likes
        }
        return duplica;
    };

    if (Array.isArray(docs)) {
        return docs.map(formatSingleDocument);
    } else {
        return formatSingleDocument(docs);
    }
};