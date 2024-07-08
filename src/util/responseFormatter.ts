import { Document } from 'mongoose';

export const formatDocument = (docs: Document | Document[]) => {
    const formatSingleDocument = (doc: Document) => {
        return doc.toObject({
            versionKey: false,
            transform: function (doc, ret) {
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
