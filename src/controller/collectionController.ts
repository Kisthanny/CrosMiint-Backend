import expressAsyncHandler from "express-async-handler";
import { ethers } from "ethers";
import Network from "../models/networkModel";
import { ValidatedRequest } from "../middleware/authMiddleware";
import Collection, { Protocol, Category as CategoryType } from "../models/collectionModel";
import User from "../models/userModel";
import { formatDocument } from "../util/responseFormatter";
import startPolling721 from "../filter/collection721Filter";
import startPolling1155 from "../filter/collection1155Filter";
import { getBlockNumber } from "../util/blockchainService";
import Category from "../models/categoryModel";
import Overview from "../models/overviewModel";

export const createCollection = expressAsyncHandler(async (req: ValidatedRequest, res) => {
    const { address: rawAddress, protocol, deployedAt } = req.body;

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
    const network = await Network.findOne({ networkId: Number(deployedAt) })
    if (!network) {
        res.status(400);
        throw new Error("invalid deployedAt networkId");
    }

    const exist = await Collection.exists({ address, deployedAt: network._id })
    if (exist) {
        res.status(400);
        throw new Error(`Collection ${address} already exists`);
    }

    if (protocol === Protocol.ERC721) {
        startPolling721(address, network.networkId);
    }
    if (protocol === Protocol.ERC1155) {
        startPolling1155(address, network.networkId);
    }


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
            const result = await User.findOne({ address: (creator as string).toLowerCase() });
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
    if (address) { query.address = { $regex: address, $options: 'i' } }
    if (protocol) { query.protocol = protocol }
    if (category) { query.category = category }
    if (name) { query.name = { $regex: name, $options: 'i' } }

    const collections = await Collection.find(query)
        .skip(skip)
        .sort({ createdAt: -1 })
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

export const getCollectionInfo = expressAsyncHandler(async (req, res) => {
    const { id } = req.query;
    if (!id) {
        res.status(400);
        throw new Error("missing argument");
    }

    const collection = await Collection.findById(id)
        .populate("owner", "address name avatar")
        .populate("deployedAt", "networkId chainName")
        .populate("overviews")
    if (!collection) {
        res.status(400);
        throw new Error(`Collection does not exist`);
    }

    res.status(200).json(formatDocument(collection));
})

export const updateCollection = expressAsyncHandler(async (req: ValidatedRequest, res) => {
    const {
        id,
        bannerImageSrc,
        logoURI,
        category,
        previewImages,
        description,
        overviews,
    } = req.body;

    if (!id) {
        res.status(400);
        throw new Error("missing argument");
    }

    const collection = await Collection.findById(id);
    if (!collection) {
        res.status(400);
        throw new Error(`Collection does not exist`);
    }

    if (String(collection.owner) !== String(req.user?._id)) {
        res.status(403);
        throw new Error("Forbidden");
    }

    if (category !== undefined) {
        if (!Object.values(CategoryType).includes(category)) {
            res.status(400);
            throw new Error(`Category ${category} does not exist`);
        }
        collection.category = category;
    }

    if (logoURI !== undefined) {
        collection.logoURI = logoURI;
    }

    if (bannerImageSrc !== undefined) {
        collection.bannerImageSrc = bannerImageSrc;
    }

    if (Array.isArray(previewImages)) {
        collection.previewImages = previewImages
    }

    if (description !== undefined) {
        collection.description = description;
    }

    if (overviews && Array.isArray(overviews)) {
        const promiseList = overviews.map(async overview => {
            if (overview.id) {
                const id = overview.id;
                delete overview.id;
                const overviewDoc = await Overview.findByIdAndUpdate(id, overview);
                return overviewDoc?._id;
            } else {
                const overviewDoc = await Overview.create(overview);
                return overviewDoc._id
            }
        })

        const overviewIds = await Promise.all(promiseList);
        collection.overviews = overviewIds;
    }

    await collection.save();

    await collection.populate([
        {
            path: "owner",
            select: "address name avatar"
        },
        {
            path: "deployedAt",
            select: "networkId chainName"
        },
        {
            path: "overviews"
        }
    ])

    res.status(200).json(formatDocument(collection));
})

export const allCollectionUpToDate = expressAsyncHandler(async (req, res, next) => {
    const collections = await Collection.find({});

    const networks = await Network.find({});
    const blockNumberMap: { [key: string]: number } = {};
    const promiseList = networks.map(async (network) => {
        const blockNumber = await getBlockNumber(network.networkId)
        return { [network._id as string]: blockNumber };
    })
    const result = await Promise.all(promiseList);
    result.forEach(o => {
        Object.assign(blockNumberMap, o);
    })
    const bulkOps = collections.map(collection => ({
        updateOne: {
            filter: { _id: collection._id },
            update: {
                $set: {
                    lastFilterBlock: blockNumberMap[String(collection.deployedAt)]
                }
            }
        }
    }));

    await Collection.bulkWrite(bulkOps);
    res.status(200).json(blockNumberMap);
})

export const createCategory = expressAsyncHandler(async (req, res, next) => {
    const { categoryList } = req.body;

    if (!Array.isArray(categoryList)) {
        res.status(400);
        throw new Error("Expecting categoryList to be Array");
    }

    const valid = categoryList.every(category => category.name && category.image);
    if (!valid) {
        res.status(400);
        throw new Error("invalid category");
    }
    const categoryDocs = categoryList.map(category => new Category({
        name: category.name,
        image: `${process.env.PINATA_GATEWAY!}${category.image}`,
    }))

    const result = await Category.bulkSave(categoryDocs);

    res.status(200).json({ result });
})

export const getCategoryList = expressAsyncHandler(async (req, res, next) => {
    const categoryList = await Category.find({});

    res.status(200).json({ dataList: formatDocument(categoryList) })
})