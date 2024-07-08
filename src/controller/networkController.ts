import expressAsyncHandler from "express-async-handler";
import Network from "../models/networkModel";
import { formatDocument } from "../util/responseFormatter";

export const createNetwork = expressAsyncHandler(async (req, res) => {
    const { networkId, chainName, chainId, gateway, nativeCurrency, blockExplorerUrls = [] } = req.body;
    if (!networkId || !chainName || !chainId || !gateway || !nativeCurrency || !nativeCurrency.name || !nativeCurrency.symbol || !nativeCurrency.decimals) {
        res.status(400);
        throw new Error("missing argument")
    }

    const exists = await Network.exists({ networkId })
    if (exists) {
        res.status(400);
        throw new Error(`Network ${networkId} already exists`)
    }

    const newNetwork = await Network.create({
        networkId,
        chainName,
        chainId,
        gateway,
        nativeCurrency,
        blockExplorerUrls
    })

    res.status(201).json(formatDocument(newNetwork));
})

export const getNetworks = expressAsyncHandler(async (req, res) => {
    const networks = await Network.find()

    res.status(200).json(formatDocument(networks))
})

export const updateNetwork = expressAsyncHandler(async (req, res) => {
    const { networkId, chainName, chainId, gateway, nativeCurrency, blockExplorerUrls } = req.body;

    if (!networkId) {
        res.status(400);
        throw new Error("missing argument")
    }

    if (nativeCurrency && (!nativeCurrency.name || !nativeCurrency.symbol || !nativeCurrency.decimals)) {
        res.status(400);
        throw new Error("missing argument")
    }

    const network = await Network.findOne({ networkId });
    if (!network) {
        res.status(400);
        throw new Error(`No such network: ${networkId}`)
    }

    network.chainName = chainName || network.chainName;
    network.chainId = chainId || network.chainId;
    network.gateway = gateway || network.gateway;
    network.nativeCurrency = nativeCurrency || network.nativeCurrency;
    network.blockExplorerUrls = blockExplorerUrls || network.blockExplorerUrls;

    const updatedNetwork = await network.save();

    res.status(200).json(formatDocument(updatedNetwork));
})

export const deleteNetwork = expressAsyncHandler(async (req, res) => {
    const { networkId } = req.body;

    if (!networkId) {
        res.status(400);
        throw new Error("missing argument")
    }

    const exist = await Network.exists({ networkId });
    if (!exist) {
        res.status(400);
        throw new Error(`Network ${networkId} does not exist`);
    }

    await Network.deleteOne({ networkId })

    res.status(200).json({ networkId, result: "success" })
})