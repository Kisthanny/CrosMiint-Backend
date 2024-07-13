import { ethers } from "ethers";
import rpcUrls from "../config/rpcUrls";
import abi from "../config/abi";
import { Protocol } from "../models/collectionModel";
import { Collection721, Collection1155, NFTMarketplace } from "../types";
import NFTMarketplaceArtifacts from "../../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";
import Marketplace from "../models/marketplaceModel";
import Network from "../models/networkModel";

export interface BlockchainServiceOptions {
    protocol: Protocol;
    address: string;
    networkId: number;
}

export const getProvider = (networkId: number): ethers.JsonRpcProvider => {
    const rpcUrl = rpcUrls[networkId];
    if (!rpcUrl) {
        throw new Error(`No RPC URL found for network ID: ${networkId}`);
    }
    return new ethers.JsonRpcProvider(rpcUrl);
}

export const getContract = ({ protocol, address, networkId }: BlockchainServiceOptions): Collection721 | Collection1155 => {
    const provider = getProvider(networkId);
    const contractAbi = protocol === Protocol.ERC721 ? abi.Collection721 : abi.Collection1155;
    if (!contractAbi) {
        throw new Error(`No ABI found for protocol: ${protocol}`);
    }

    // 根据协议选择合约类型
    switch (protocol) {
        case Protocol.ERC721:
            return new ethers.Contract(address, contractAbi, provider) as unknown as Collection721;
        case Protocol.ERC1155:
            return new ethers.Contract(address, contractAbi, provider) as unknown as Collection1155;
        default:
            throw new Error(`Unsupported protocol: ${protocol}`);
    }
}

export const getMarketplaceContract = (address: string, networkId: string | number) => {
    const provider = getProvider(Number(networkId));
    const contractAbi = abi.NFTMarketplace;
    return new ethers.Contract(address, contractAbi, provider) as unknown as NFTMarketplace;
}

export const getBlockTime = async (networkId: number) => {
    const provider = getProvider(networkId);
    const block = await provider.getBlock("latest");
    if (!block) {
        throw new Error()
    }
    return block.timestamp;
}

export const blockTimeToDate = (blockTime: number | bigint): Date => {
    let timeInMillis: number;

    if (typeof blockTime === 'bigint') {
        timeInMillis = Number(blockTime);
    } else {
        timeInMillis = blockTime;
    }

    // Check if the blockTime is in seconds or milliseconds
    // If the blockTime is less than 1e10, it's likely in seconds
    if (timeInMillis < 1e10) {
        return new Date(timeInMillis * 1000); // Convert seconds to milliseconds
    }
    return new Date(timeInMillis); // Already in milliseconds
};
