import expressAsyncHandler from "express-async-handler";
import { ethers } from "ethers";
import Network from "../models/networkModel";
import { ValidatedRequest } from "../middleware/authMiddleware";
import Collection, { Protocol, Category } from "../models/collectionModel";
import User from "../models/userModel";
import { blockTimeToDate, getBlockTime, getContract } from "../util/blockchainService";
import { formatDocument } from "../util/responseFormatter";
import Airdrop from "../models/airdropModel";
import { Collection721 } from "../types";
const AIRDROP_STAGES = ["upcoming", "finished"];
type StageType = "upcoming" | "finished";
// creates the current airdrop of the given collection
export const createAirdrop = expressAsyncHandler(async (req, res) => {
    const { address: rawAddress } = req.body;
    const address = (rawAddress as string).toLocaleLowerCase();

    if (!address) {
        res.status(400);
        throw new Error("missing argument");
    }

    const collection = await Collection.findOne({ address }).populate("deployedAt", "networkId");
    if (!collection) {
        res.status(400);
        throw new Error(`Collection ${address} does not exist`);
    }

    if (collection.protocol !== Protocol.ERC721) {
        res.status(400);
        throw new Error("only ERC721 can drop")
    }

    const contract = getContract({
        address: address,
        protocol: Protocol.ERC721,
        networkId: collection.deployedAt.networkId,
    }) as Collection721;

    const currentDrop = await contract.currentDrop();

    const currentTime = await getBlockTime(collection.deployedAt.networkId);

    if (currentDrop.endTime <= currentTime) {
        res.status(400);
        throw new Error("No ongoing airdrop");
    }

    const dropIndex = currentDrop.dropId.toString();
    const supply = currentDrop.supply.toString();
    const minted = currentDrop.minted.toString();
    const mintLimitPerWallet = currentDrop.mintLimitPerWallet.toString();
    const price = currentDrop.price.toString();
    const hasWhiteListPhase = currentDrop.hasWhiteListPhase;
    const whiteListPrice = currentDrop.whiteListPrice.toString();
    const startTime = blockTimeToDate(currentDrop.startTime);
    const endTime = blockTimeToDate(currentDrop.endTime);
    const whiteListEndTime = blockTimeToDate(currentDrop.whiteListEndTime);

    const exist = await Airdrop.exists({ fromCollection: collection, dropIndex });
    if (exist) {
        res.status(400);
        throw new Error("airdrop already exists");
    }

    const newAirdrop = await Airdrop.create({
        fromCollection: collection,
        dropIndex,
        supply,
        minted,
        startTime,
        endTime,
        price,
        hasWhiteListPhase,
        whiteListEndTime,
        whiteListPrice,
        mintLimitPerWallet
    })

    const airdrop = await newAirdrop.populate("fromCollection", "address name symbol");

    res.status(200).json(formatDocument(airdrop));
})

export const getAirdropList = expressAsyncHandler(async (req, res) => {
    const { address: rawAddress, stage, networkId, category, pageNum = 1, pageSize = 10 } = req.query;

    const limit = parseInt(pageSize as string, 10);
    const page = parseInt(pageNum as string, 10);
    const skip = (page - 1) * limit;

    const query: any = {};

    if (rawAddress) {
        const address = (rawAddress as string).toLocaleLowerCase();
        const collection = await Collection.findOne({ address });
        if (!collection) {
            res.status(400);
            throw new Error(`Invalid Collection ${address}`);
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
        .populate({
            path: "fromCollection",
            select: "address owner logoURI name deployedAt",
            populate: [
                {
                    path: "owner",
                    select: "name",
                },
                {
                    path: "deployedAt",
                    select: "chainName",
                },
            ],
        })

    const pages = Math.ceil(total / limit);

    res.status(200).json({
        dataList: formatDocument(airdrops),
        total,
        page,
        pages,
    });
});