import expressAsyncHandler from "express-async-handler";
import Log from "../models/logModel";
import { formatDocument } from "../util/responseFormatter";

export const getLogs = expressAsyncHandler(async (req, res) => {
    const { size = '200', kind, content } = req.query;

    // Build the filter object
    const filter: any = {};
    if (kind) {
        filter.kind = { $regex: kind, $options: 'i' }; // 'i' for case-insensitive
    }
    if (content) {
        filter.content = { $regex: content, $options: 'i' };
    }

    // Find logs with the specified filter, sort by creation date in descending order, and limit the results
    const logs = await Log.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(String(size), 10));

    res.status(200).json(formatDocument(logs));
});