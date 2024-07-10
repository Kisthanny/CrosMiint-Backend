import expressAsyncHandler from "express-async-handler";
import { ValidatedRequest } from "../middleware/authMiddleware";
import Collection, { Protocol } from "../models/collectionModel";
import { getContract } from "../util/blockchainService";
import { formatDocument } from "../util/responseFormatter";
import { Collection721, Collection1155 } from "../types";
import NFT, { MetadataType } from "../models/nftModel";
import User from "../models/userModel";

const createNFT = async (tokenId: string, contract: Collection721, user: any, collectionId: any, metadataType: MetadataType) => {
    const validOwner = (await contract.ownerOf(tokenId)).toLocaleLowerCase() === user.address;

    if (!validOwner) {
        throw new Error(`Unauthorized for tokenId ${tokenId}`);
    }

    const exist = await NFT.exists({
        fromCollection: collectionId,
        tokenId
    })
    if (exist) {
        throw new Error(`token ${tokenId} existed`);
    }

    return new NFT({
        tokenId,
        amount: 1,
        owner: user._id,
        fromCollection: collectionId,
        metadataType
    });
};

export const create721Token = expressAsyncHandler(async (req: ValidatedRequest, res) => {
    const { startTokenId, amount = 1, collection: rawAddress, metadataType } = req.body;

    const user = req.user;
    if (!user) {
        res.status(400);
        throw new Error("Unauthorized");
    }

    if (!startTokenId || !rawAddress || !metadataType) {
        res.status(400);
        throw new Error("missing argument");
    }

    const collection = (rawAddress as string).toLocaleLowerCase();
    const collectionDoc = await Collection.findOne({ address: collection }).populate("deployedAt", "networkId");
    if (!collectionDoc) {
        res.status(400);
        throw new Error(`Invalid Collection ${collection}`);
    }

    if (!Object.values(MetadataType).includes(metadataType)) {
        res.status(400);
        throw new Error(`MetadataType ${metadataType} does not exist`);
    }

    const contract = getContract({
        protocol: Protocol.ERC721,
        address: collection,
        networkId: collectionDoc.deployedAt.networkId,
    }) as Collection721;

    const createNFTPromises = [];
    for (let i = 0; i < amount; i++) {
        const tokenId = (BigInt(startTokenId) + BigInt(i)).toString();
        createNFTPromises.push(createNFT(tokenId, contract, user, collectionDoc._id, metadataType));
    }

    const newNFTs = await Promise.all(createNFTPromises);
    const createdNFTs = await NFT.insertMany(newNFTs);

    res.status(200).json(formatDocument(createdNFTs));
})

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

    // get tokenURI from DB NFT document => DB Collection document => blockchain view
    const getURIFallback = async () => {
        if (nft.tokenURI) {
            return nft.tokenURI
        }

        // need to delete the previewImage after reveal
        if (collectionDoc.previewImage) {
            return collectionDoc.previewImage;
        }

        try {
            const contract = getContract({
                protocol: collectionDoc.protocol,
                address: address,
                networkId: collectionDoc.deployedAt.networkId,
            })
            if (collectionDoc.protocol === Protocol.ERC721) {
                const tokenURI = await (contract as Collection721).tokenURI(tokenId as string);
                nft.tokenURI = tokenURI;
                await nft.save();
                return tokenURI;
            }
            if (collectionDoc.protocol === Protocol.ERC1155) {
                const uri = await (contract as Collection1155).uri(tokenId as string);
                nft.tokenURI = uri;
                await nft.save();
                return uri;
            }
        } catch (error) {
            if ((error as Error).message.includes("Not revealed yet")) {
                return "";
            } else {
                throw error;
            }
        }
    }

    const tokenURI = await getURIFallback();
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
        .populate("owner", "address name avatar")
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
                    select: "chainName",
                },
            ],
        })

    const total = await NFT.countDocuments(query);

    res.status(200).json({
        dataList: formatDocument(nfts),
        total,
        page,
        pages: Math.ceil(total / limit),
    })
})