import expressAsyncHandler from "express-async-handler";
import { formatDocument } from "../util/responseFormatter";
import User from "../models/userModel";
import Network from "../models/networkModel";
import Marketplace from "../models/marketplaceModel";
import Listing, { ListingStatus } from "../models/listingModel";
import { ethers } from "ethers";
import mongoose from "mongoose";
import startPollingMarketplace from "../filter/marketplaceFilter";

export enum Sort {
    PriceAsc = "priceAsc",
    PriceDesc = "priceDesc",
    DateAsc = "dateAsc",
    DateDesc = "dateDesc",
}

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

    startPollingMarketplace(address, networkId);

    res.status(200).json({ message: "success" })
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

    startPollingMarketplace(address, networkId);
    res.status(200).json(formatDocument(marketplace))
})

export const getMarketplaceList = expressAsyncHandler(async (req, res) => {
    const dataList = await Marketplace.find().populate("network", "networkId chainName");
    res.status(200).json({ dataList: formatDocument(dataList) });
})

export const getListingList = expressAsyncHandler(async (req, res) => {
    const {
        seller: rawSeller,
        status,
        minPrice,
        maxPrice,
        minDate,
        maxDate,
        sort,
        networkId,
        pageNum = 1,
        pageSize = 10
    } = req.query;

    const query: {
        seller?: string;
        status?: ListingStatus;
        minPrice?: string;
        maxPrice?: string;
        minDate?: Date;
        maxDate?: Date;
        sort?: Sort;
        network?: mongoose.Schema.Types.ObjectId;
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
        const valid = Object.values(ListingStatus).includes(status as ListingStatus)
        if (!valid) {
            res.status(400);
            throw new Error(`Invalid status ${status}`)
        }
        query.status = status as ListingStatus;
    }

    const limit = parseInt(pageSize as string, 10);
    const page = parseInt(pageNum as string, 10);
    const skip = (page - 1) * limit;

    const dataList = await Listing.find(query)
        .skip(skip)
        .limit(limit)
        .populate("seller", "address name avatar")
        .populate("nft", "tokenURI tokenId")
        .populate("network", "networkId chainName")

    const total = await Listing.countDocuments(query);

    res.status(200).json({
        dataList: formatDocument(dataList),
        total,
        page,
        pages: Math.ceil(total / limit),
    })
})
