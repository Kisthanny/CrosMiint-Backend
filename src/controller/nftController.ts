import expressAsyncHandler from "express-async-handler";
import Collection, { Protocol } from "../models/collectionModel";
import { getContract } from "../util/blockchainService";
import { formatDocument } from "../util/responseFormatter";
import { Collection721, Collection1155 } from "../types";
import NFT, { MetadataType } from "../models/nftModel";
import User from "../models/userModel";
import Network from "../models/networkModel";

export const getTokenURI = expressAsyncHandler(async (req, res) => {
    const { collection: rawAddress, tokenId } = req.query;
    if (!rawAddress || !tokenId) {
        res.status(400);
        throw new Error("missing argument")
    }
    const address = (rawAddress as string).toLocaleLowerCase();
    const collectionDoc = await Collection.findOne({ address })
        .populate("deployedAt", "networkId");
    if (!collectionDoc) {
        res.status(400);
        throw new Error(`Invalid Colleciton ${address}`);
    }
    const nft = await NFT.findOne({
        fromCollection: collectionDoc._id,
        tokenId,
    })

    if (!nft) {
        res.status(400);
        throw new Error(`Invalid Token ${address}/${tokenId}`);
    }

    // get tokenURI from DB NFT document => DB Collection document
    const getURIFallback = () => {
        if (nft.tokenURI) {
            return nft.tokenURI
        }

        // need to delete the previewImage after reveal
        if (collectionDoc.previewImage) {
            return collectionDoc.previewImage;
        }

        return "";
    }

    const tokenURI = getURIFallback();
    res.status(200).json({ collection: address, tokenId, tokenURI });
})

export const getNFTList = expressAsyncHandler(async (req, res) => {
    const { collection: rawCollection, owner: rawOwner, metadataType, pageNum = 1, pageSize = 10 } = req.query;

    const query: {
        fromCollection?: string;
        owner?: string;
        metadataType?: MetadataType;
    } = {}

    if (rawCollection) {
        const address = (rawCollection as string).toLocaleLowerCase();
        const collection = await Collection.findOne({ address })
        if (!collection) {
            res.status(400);
            throw new Error(`Invalid Collection ${rawCollection}`);
        }
        query.fromCollection = collection._id as string;
    }

    if (rawOwner) {
        const address = (rawOwner as string).toLocaleLowerCase();
        const user = await User.findOne({ address })
        if (!user) {
            res.status(400);
            throw new Error(`Invalid Owner ${rawOwner}`);
        }
        query.owner = user._id as string;
    }

    if (metadataType) {
        const includes = Object.values(MetadataType).includes(metadataType as MetadataType);
        if (!includes) {
            res.status(400);
            throw new Error(`Invalid MetadataType ${metadataType}`);
        }
        query.metadataType = metadataType as MetadataType;
    }

    const limit = parseInt(pageSize as string, 10);
    const page = parseInt(pageNum as string, 10);
    const skip = (page - 1) * limit;

    const nfts = await NFT.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })

    const total = await NFT.countDocuments(query);

    const nftsWithoutOwnerList = formatDocument(nfts).map((e: any) => {
        const { owners, ...props } = e;
        return { ...props };
    })
    res.status(200).json({
        dataList: nftsWithoutOwnerList,
        total,
        page,
        pages: Math.ceil(total / limit),
    })
})

export const getNFTInfo = expressAsyncHandler(async (req, res) => {
    const { collection: rawAddress, networkId, tokenId } = req.query;
    if (!rawAddress || !networkId || !tokenId) {
        res.status(400);
        throw new Error("missing argument");
    }

    const network = await Network.findOne({ networkId });
    if (!network) {
        res.status(400);
        throw new Error(`Invalid Network ${networkId}`);
    }

    const collection = await Collection.findOne({
        address: (rawAddress as string).toLowerCase(),
        deployedAt: network._id,
    });
    if (!collection) {
        res.status(400);
        throw new Error(`Invalid Collection ${rawAddress} in Network ${networkId}`);
    }

    const nft = await NFT.findOne({
        fromCollection: collection._id,
        tokenId,
    })
        .populate({
            path: "fromCollection",
            select: "address owner logoURI name deployedAt previewImage protocol category",
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
        });

    if (!nft) {
        res.status(404);
        throw new Error(`NFT not found for tokenId ${tokenId}`);
    }

    // Sort owners by amount and get top 10
    nft.owners.sort((a, b) => parseInt(b.amount) - parseInt(a.amount));
    const topOwners = nft.owners.slice(0, 10);

    // Populate top 10 owners
    await NFT.populate(nft, {
        path: 'owners.owner',
        match: { _id: { $in: topOwners.map(owner => owner.owner) } },
        select: 'address name'
    });

    // Update owners with only top 10 populated
    nft.owners = topOwners;

    res.status(200).json(formatDocument(nft))
})