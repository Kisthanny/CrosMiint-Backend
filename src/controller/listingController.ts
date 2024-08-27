import expressAsyncHandler from "express-async-handler";
import { formatDocument } from "../util/responseFormatter";
import Listing, { ListingStatus } from "../models/listingModel";
import User from "../models/userModel";
import Network from "../models/networkModel";

export enum Sort {
    PriceAsc = "priceAsc",
    PriceDesc = "priceDesc",
    DateAsc = "dateAsc",
    DateDesc = "dateDesc",
}
export const getListings = expressAsyncHandler(async (req, res) => {
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
        network?: string;
        price?: { $gte?: string, $lte?: string };
        createdAt?: { $gte?: Date, $lte?: Date };
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
        const valid = Object.values(ListingStatus).includes(status as ListingStatus);
        if (!valid) {
            res.status(400);
            throw new Error(`Invalid status ${status}`)
        }
        query.status = status as ListingStatus;
    }

    if (networkId) {
        const network = await Network.findOne({ networkId });
        if (!network) {
            res.status(400);
            throw new Error(`Invalid Network ${networkId}`)
        }
        query.network = network._id as string;
    }

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) {
            query.price.$gte = minPrice as string;
        }
        if (maxPrice) {
            query.price.$lte = maxPrice as string;
        }
    }

    if (minDate || maxDate) {
        query.createdAt = {};
        if (minDate) {
            query.createdAt.$gte = new Date(minDate as string);
        }
        if (maxDate) {
            query.createdAt.$lte = new Date(maxDate as string);
        }
    }

    const limit = parseInt(pageSize as string, 10);
    const page = parseInt(pageNum as string, 10);
    const skip = (page - 1) * limit;

    const sortOptions: { [key: string]: { [key: string]: 1 | -1 } } = {
        [Sort.PriceAsc]: { price: 1 },
        [Sort.PriceDesc]: { price: -1 },
        [Sort.DateAsc]: { createdAt: 1 },
        [Sort.DateDesc]: { createdAt: -1 },
    };

    const sortOption = sortOptions[sort as string] || { createdAt: -1 }; // Default sort by date descending

    const dataList = await Listing.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sortOption)
        .populate("seller", "address name avatar")
        .populate("nft", "tokenURI tokenId")
        .populate("network", "networkId chainName")

    const total = await Listing.countDocuments(query);

    res.status(200).json({
        dataList: formatDocument(dataList),
        total,
        page,
        pages: Math.ceil(total / limit),
    });
});

export const getListingInfo = expressAsyncHandler(async (req, res) => {
    const { listingId, networkId } = req.query;

    if (!listingId || !networkId) {
        res.status(400);
        throw new Error("missing argument");
    }

    const network = await Network.findOne({ networkId });
    if (!network) {
        res.status(400);
        throw new Error(`Invalid Network ${networkId}`)
    }

    const listing = await Listing.findOne({
        network: network._id,
        listingId,
    })
        .populate("seller", "address name avatar")
        .populate("network", "networkId chainName")
        .populate({
            path: "offers",
            select: "offerIndex offerer price amount accepted",
            populate: [
                {
                    path: "offerer",
                    select: "address name"
                }
            ]
        })
        .populate({
            path: "nft",
            select: "tokenURI tokenId fromCollection metadataType",
            populate: [
                {
                    path: "fromCollection",
                    select: "address previewImages name symbol",
                }
            ]
        })
    if (!listing) {
        throw new Error(`Invalid Listing ${listingId} in Network ${networkId}`);
    }

    res.status(400).json(formatDocument(listing));
})
