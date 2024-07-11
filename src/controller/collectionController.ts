import expressAsyncHandler from "express-async-handler";
import { ethers } from "ethers";
import Network from "../models/networkModel";
import { ValidatedRequest } from "../middleware/authMiddleware";
import Collection, { Protocol, Category } from "../models/collectionModel";
import User from "../models/userModel";
import { getContract } from "../util/blockchainService";
import { formatDocument } from "../util/responseFormatter";
import addColleciton721Listener from "../listener/collection721Listener";

type SingleNetwork = {
    networkId: number;
    networkCollection: string;
}

export const createCollection = expressAsyncHandler(async (req: ValidatedRequest, res) => {
    const { address: rawAddress, protocol, deployedAt, networks = [] } = req.body;

    const address = (rawAddress as String).toLocaleLowerCase();

    if (!address || !protocol || !deployedAt) {
        res.status(400);
        throw new Error("missing argument");
    }
    if (!ethers.isAddress(address)) {
        res.status(400);
        throw new Error("invalid address");
    }
    if (!Object.values(Protocol).includes(protocol)) {
        res.status(400);
        throw new Error("invalid protocol");
    }

    const exist = await Collection.exists({ address })
    if (exist) {
        res.status(400);
        throw new Error(`Collection ${address} already exists`);
    }

    const allNetworks = await Network.find();
    const network = allNetworks.find(n => n.networkId === Number(deployedAt))
    if (!network) {
        res.status(400);
        throw new Error("invalid deployedAt networkId");
    }

    const networkIds = allNetworks.map(n => n.networkId);
    const updateCrosschainCollections = networks.map(async (n: SingleNetwork) => {
        if (!networkIds.includes(n.networkId) && ethers.isAddress(n.networkCollection)) {
            res.status(400);
            throw new Error("invalid networks");
        }
        const crosschainCollection = await Collection.findOne({ address: n.networkCollection.toLocaleLowerCase() });
        if (crosschainCollection) {
            if (crosschainCollection.networks?.find(e => e.networkId === deployedAt)) {
                return;
            }
            crosschainCollection.networks?.push({ networkId: deployedAt, networkCollection: address });
            await crosschainCollection.save();
        }
    })

    await Promise.all(updateCrosschainCollections);

    addColleciton721Listener(address, network.networkId, networks);

    res.status(200).json({ message: "success" });
})

export const getCollections = expressAsyncHandler(async (req, res) => {
    const { address, creator, name, protocol, networkId, category, pageSize, pageNum } = req.query;
    if (!pageSize || !pageNum) {
        res.status(400);
        throw new Error("missing argument");
    }
    const getOwner = async () => {
        if (creator) {
            const result = await User.findOne({ address: creator });
            return result?._id || undefined;
        }
        return undefined;
    }
    const getNetwork = async () => {
        if (networkId) {
            const result = await Network.findOne({ networkId })
            return result?._id || undefined;
        }
        return undefined;
    }
    const [owner, deployedAt] = await Promise.all([getOwner(), getNetwork()])

    const limit = parseInt(pageSize as string, 10);
    const page = parseInt(pageNum as string, 10);
    const skip = (page - 1) * limit;

    const query: any = {}
    if (owner) { query.owner = owner }
    if (deployedAt) { query.deployedAt = deployedAt }
    if (address) { query.address = address }
    if (protocol) { query.protocol = protocol }
    if (category) { query.category = category }
    if (name) { query.name = { $regex: name, $options: 'i' } }

    const collections = await Collection.find(query)
        .skip(skip)
        .limit(limit)
        .populate("owner", "address name avatar")
        .populate("deployedAt", "networkId chainName")

    const total = await Collection.countDocuments(query);

    res.status(200).json({
        dataList: formatDocument(collections),
        total,
        page,
        pages: Math.ceil(total / limit),
    })
})

export const updateCategory = expressAsyncHandler(async (req: ValidatedRequest, res) => {
    const { address: rawAddress, category } = req.body;

    const address = (rawAddress as string).toLocaleLowerCase();

    const collection = await Collection.findOne({ address });
    if (!collection) {
        res.status(400);
        throw new Error(`Collection ${address} does not exist`);
    }

    if (String(collection.owner) !== String(req.user?._id)) {
        res.status(401);
        throw new Error("Unauthorized");
    }

    if (!Object.values(Category).includes(category)) {
        res.status(400);
        throw new Error(`Category ${category} does not exist`);
    }

    collection.category = category;
    await collection.save();

    res.status(200).json(formatDocument(collection));
})

export const updatePreviewImage = expressAsyncHandler(async (req: ValidatedRequest, res) => {
    const { address: rawAddress, previewImage } = req.body;

    const address = (rawAddress as string).toLocaleLowerCase();

    const collection = await Collection.findOne({ address });
    if (!collection) {
        res.status(400);
        throw new Error(`Collection ${address} does not exist`);
    }

    if (String(collection.owner) !== String(req.user?._id)) {
        res.status(401);
        throw new Error("Unauthorized");
    }

    collection.previewImage = previewImage;
    await collection.save();

    res.status(200).json(formatDocument(collection));
})