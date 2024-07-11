import expressAsyncHandler from "express-async-handler";
import { ValidatedRequest } from "../middleware/authMiddleware";
import Collection, { Protocol } from "../models/collectionModel";
import { getMarketplaceContract } from "../util/blockchainService";
import { formatDocument } from "../util/responseFormatter";
import { Collection721, Collection1155, NFTMarketplace } from "../types";
import NFT from "../models/nftModel";
import User from "../models/userModel";
import { ethers } from "ethers";
import Network from "../models/networkModel";
import Marketplace from "../models/marketplaceModel";
import MarketItem, { MarketItemStatus, IOffer, Offer } from "../models/marketItemModel";
import { findOrCreateUser } from "./userController";

export const createListing = expressAsyncHandler(async (req: ValidatedRequest, res) => {
    const { networkId, listingId, amount = 1 } = req.body;
    if (!networkId || !listingId) {
        res.status(400);
        throw new Error("missing argument");
    }
    if (isNaN(amount)) {
        res.status(400);
        throw new Error(`Invalid amount ${amount}`);
    }

    const network = await Network.findOne({ networkId });
    if (!network) {
        res.status(400);
        throw new Error(`Invalid networkId ${networkId}`)
    }

    const marketplace = await Marketplace.findOne({ network });
    if (!marketplace) {
        res.status(400);
        throw new Error(`Invalid Marketplace at network: ${networkId}\nplease contact admin`);
    }

    const marketplaceContract = await getMarketplaceContract(networkId);
    const listing = await marketplaceContract.listings(listingId);

    if (listing.contractAddress === ethers.ZeroAddress) {
        res.status(400);
        throw new Error(`Invalid listing ${listingId}`)
    }

    const seller = await findOrCreateUser(listing.seller);

    const collection = await Collection.findOne({ address: listing.contractAddress.toLocaleLowerCase() });
    if (!collection) {
        res.status(400);
        throw new Error(`Unregistered Collection ${listing.contractAddress}`);
    }

    const nft = await NFT.findOne({ fromCollection: collection._id, tokenId: listing.tokenId });
    if (!nft) {
        res.status(400);
        throw new Error(`Unregistered NFT ${listing.contractAddress}/${listing.tokenId}`);
    }

    const previouseMarket = await MarketItem.find({ nft }).sort(({ createdAt: -1 })).limit(1);
    if (previouseMarket.length && previouseMarket[0].status === MarketItemStatus.Listed) {
        res.status(400);
        throw new Error("MarketItem is still listed");
    }

    const marketItem = await MarketItem.create({
        seller,
        price: listing.price.toString(),
        nft: nft._id,
        listedAt: new Date(),
        status: listing.active ? MarketItemStatus.Listed : MarketItemStatus.Canceled,
        listAmount: String(amount),
        listingId,
        network: network._id,
        offers: [],
    })

    nft.latestMarket = marketItem;
    await nft.save();

    res.status(200).json(formatDocument(marketItem))
})

export const createMarketplace = expressAsyncHandler(async (req, res) => {
    const { address, networkId } = req.body;
    if (!address || !networkId) {
        res.status(400);
        throw new Error("missing argument");
    }

    if (!ethers.isAddress(address)) {
        res.status(400);
        throw new Error("Invalid address");
    }

    const network = await Network.findOne({
        networkId,
    })
    if (!network) {
        res.status(400);
        throw new Error("Invalid networkId");
    }

    const exist = await Marketplace.exists({ network });
    if (exist) {
        res.status(400);
        throw new Error(`Marketplace on network ${networkId} already exists`);
    }

    const marketplace = await Marketplace.create({
        address,
        network,
    })
    res.status(200).json(formatDocument(marketplace))
})

export const updateMarketplace = expressAsyncHandler(async (req, res) => {
    const { address, networkId } = req.body;
    if (!address || !networkId) {
        res.status(400);
        throw new Error("missing argument");
    }

    if (!ethers.isAddress(address)) {
        res.status(400);
        throw new Error("Invalid address");
    }

    const network = await Network.findOne({
        networkId,
    })
    if (!network) {
        res.status(400);
        throw new Error("Invalid networkId");
    }

    const marketplace = await Marketplace.findOne({ network });
    if (!marketplace) {
        res.status(400);
        throw new Error(`create Marketplace first`);
    }

    marketplace.address = address;
    await marketplace.save();
    res.status(200).json(formatDocument(marketplace))
})

export const getMarketplaceList = expressAsyncHandler(async (req, res) => {
    const dataList = await Marketplace.find().populate("network", "networkId chainName");
    res.status(200).json({ dataList: formatDocument(dataList) });
})

export const getListingList = expressAsyncHandler(async (req, res) => {
    const { seller: rawSeller, status, pageNum = 1, pageSize = 10 } = req.query;

    const query: {
        seller?: string;
        status?: MarketItemStatus;
    } = {};

    if (rawSeller) {
        const sellerAddress = (rawSeller as string).toLocaleLowerCase();
        const seller = await User.findOne({ address: sellerAddress });
        if (!seller) {
            res.status(400);
            throw new Error(`Invalid seller ${rawSeller}`)
        }
        query.seller = seller._id as string;
    }

    if (status) {
        const valid = Object.values(MarketItemStatus).includes(status as MarketItemStatus)
        if (!valid) {
            res.status(400);
            throw new Error(`Invalid status ${status}`)
        }
        query.status = status as MarketItemStatus;
    }

    const limit = parseInt(pageSize as string, 10);
    const page = parseInt(pageNum as string, 10);
    const skip = (page - 1) * limit;

    const dataList = await MarketItem.find(query)
        .skip(skip)
        .limit(limit)
        .populate("seller", "address name avatar")
        .populate("nft", "tokenURI tokenId")

    const total = await MarketItem.countDocuments(query);

    res.status(200).json({
        dataList: formatDocument(dataList),
        total,
        page,
        pages: Math.ceil(total / limit),
    })
})

export const offerMade = expressAsyncHandler(async (req, res) => {
    const { networkId, listingId, offerer, offerPrice, offerIndex } = req.body;
    if (!networkId || !listingId || !offerer || !offerPrice) {
        res.status(400);
        throw new Error("missing argument");
    }

    if (!ethers.isAddress(offerer)) {
        res.status(400);
        throw new Error(`Invalid address ${offerer}`);
    }

    const offererDoc = await findOrCreateUser(offerer);

    const network = await Network.findOne({ networkId });
    if (!network) {
        res.status(400);
        throw new Error(`Invalid networkId ${networkId}`)
    }

    const listingDoc = await MarketItem.findOne({ network, listingId });
    if (!listingDoc) {
        res.status(400);
        throw new Error(`Invalid listingId ${listingId}`);
    }

    const newOffer = await Offer.create({
        offerIndex,
        user: offererDoc,
        price: offerPrice,
    })

    listingDoc.offers.push(newOffer);
    await listingDoc.save();

    res.status(200).json({
        listing: formatDocument(listingDoc),
        newOffer: formatDocument(newOffer),
    })
})
