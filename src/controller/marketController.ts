import expressAsyncHandler from "express-async-handler";
import { formatDocument } from "../util/responseFormatter";
import Network from "../models/networkModel";
import Marketplace from "../models/marketplaceModel";
import { ethers } from "ethers";
import startPollingMarketplace from "../filter/marketplaceFilter";

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
