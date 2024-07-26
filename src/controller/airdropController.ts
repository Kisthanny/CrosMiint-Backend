import expressAsyncHandler from "express-async-handler";
import Collection from "../models/collectionModel";
import { formatDocument, formatLikes } from "../util/responseFormatter";
import Airdrop from "../models/airdropModel";
import Network from "../models/networkModel";
import { ValidatedRequest } from "../middleware/authMiddleware";
const AIRDROP_STAGES = ["upcoming", "finished"];
type StageType = "upcoming" | "finished";

export const getAirdropList = expressAsyncHandler(async (req: ValidatedRequest, res) => {
    const { address: rawAddress, networkId, stage, pageNum = 1, pageSize = 10 } = req.query;

    const limit = parseInt(pageSize as string, 10);
    const page = parseInt(pageNum as string, 10);
    const skip = (page - 1) * limit;

    const query: any = {};

    if (rawAddress && networkId) {
        const address = (rawAddress as string).toLocaleLowerCase();
        const network = await Network.findOne({ networkId });
        if (!network) {
            res.status(400);
            throw new Error(`Invalid Network ${networkId}`);
        }
        const collection = await Collection.findOne({ address, deployedAt: network._id });
        if (!collection) {
            res.status(400);
            throw new Error(`Invalid Collection ${address} in Network${networkId}`);
        }
        query.fromCollection = collection._id;
    }

    if (stage) {
        if (!AIRDROP_STAGES.includes(stage as string)) {
            res.status(400);
            throw new Error(`Invalid stage ${stage}`);
        }

        const currentTime = new Date();
        const stageQuery = {
            upcoming: { endTime: { $gt: currentTime } },
            finished: { endTime: { $lt: currentTime } },
        }[stage as StageType];

        Object.assign(query, stageQuery);
    }

    const total = await Airdrop.countDocuments(query);

    const airdrops = await Airdrop.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate({
            path: "fromCollection",
            select: "address owner logoURI name deployedAt previewImage",
            populate: [
                {
                    path: "owner",
                    select: "name",
                },
                {
                    path: "deployedAt",
                    select: "chainName networkId",
                },
            ],
        })

    const pages = Math.ceil(total / limit);

    res.status(200).json({
        dataList: formatLikes(formatDocument(airdrops), req.user),
        total,
        page,
        pages,
    });
});

export const getAirdropInfo = expressAsyncHandler(async (req, res) => {
    const { address: rawAddress, networkId, dropIndex } = req.query;

    if (!rawAddress || !networkId || !dropIndex) {
        res.status(400);
        throw new Error("missing argument");
    }

    const address = (rawAddress as string).toLocaleLowerCase();
    const network = await Network.findOne({ networkId });
    if (!network) {
        res.status(400);
        throw new Error(`Invalid Network ${networkId}`);
    }
    const collection = await Collection.findOne({ address, deployedAt: network._id });
    if (!collection) {
        res.status(400);
        throw new Error(`Invalid Collection ${address} in Network${networkId}`);
    }

    const airdrop = await Airdrop.findOne({
        fromCollection: collection._id,
        dropIndex,
    })
        .populate({
            path: "fromCollection",
            select: "address owner logoURI name deployedAt previewImage",
            populate: [
                {
                    path: "owner",
                    select: "name",
                },
                {
                    path: "deployedAt",
                    select: "chainName networkId",
                },
            ],
        })

    if (!airdrop) {
        res.status(400);
        throw new Error(`Invalid Airdrop ${dropIndex} in Collection ${rawAddress}`);
    }

    res.status(200).json(formatDocument(airdrop));
})

export const likeAirdrop = expressAsyncHandler(async (req: ValidatedRequest, res) => {
    const { airdropId } = req.body;
    const user = req.user;
    if (!user) {
        res.status(401);
        throw new Error("Unauthorized");
    }

    const userId = user._id as string;

    const airdrop = await Airdrop.findById(airdropId);
    if (!airdrop) {
        res.status(404);
        throw new Error("Airdrop not found");
    }

    // 检查用户是否已经点赞
    if (airdrop.likes.includes(userId)) {
        res.status(400);
        throw new Error("User already liked this airdrop");
    }

    // 添加用户ID到点赞列表
    airdrop.likes.push(userId);
    await airdrop.save();

    res.status(200).json({ message: "Airdrop liked successfully", success: true });
});

export const unlikeAirdrop = expressAsyncHandler(async (req: ValidatedRequest, res) => {
    const { airdropId } = req.body;
    const user = req.user;
    if (!user) {
        res.status(401);
        throw new Error("Unauthorized");
    }

    const userId = user._id as string;

    const airdrop = await Airdrop.findById(airdropId);
    if (!airdrop) {
        res.status(404);
        throw new Error("Airdrop not found");
    }

    // 检查用户是否点赞
    const index = airdrop.likes.indexOf(userId);
    if (index === -1) {
        res.status(400);
        throw new Error("User has not liked this airdrop");
    }

    // 从点赞列表中移除用户ID
    airdrop.likes.splice(index, 1);
    await airdrop.save();

    res.status(200).json({ message: "Airdrop unliked successfully", success: true });
});