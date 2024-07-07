import { Document } from 'mongoose';

export const formatDocument = (doc: Document) => {
    return doc.toObject({
        versionKey: false,
        transform: function (doc, ret) {
            delete ret._id;
            return ret;
        }
    });
};
