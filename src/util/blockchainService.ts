import { ethers } from "ethers";
import { rpcUrls, wsUrls } from "../config/rpcUrls";
import abi from "../config/abi";
import { Protocol } from "../models/collectionModel";
import { Collection721, Collection1155, NFTMarketplace } from "../types";
import { retry } from "./retry";

export interface BlockchainServiceOptions {
    protocol: Protocol;
    address: string;
    networkId: number;
}

export const getProvider = (networkId: number, ws: boolean = false): ethers.JsonRpcProvider | ethers.WebSocketProvider => {
    const rpcUrl = rpcUrls[networkId];
    const wsUrl = wsUrls[networkId];
    if (!rpcUrl && !wsUrl) {
        throw new Error(`No api URL found for network ID: ${networkId}`);
    }
    if (ws && wsUrl) {
        return new ethers.WebSocketProvider(wsUrl);
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
    const block = await retry(() => provider.getBlock("latest"));
    if (!block) {
        throw new Error("no block")
    }
    return block.timestamp;
}

export const getBlockNumber = async (networkId: number) => {
    const provider = getProvider(networkId);

    return retry(async () => {
        return await provider.getBlockNumber()
    });
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

export const convertAddress = (hexAddress: string, isContract: boolean = false) => {
    let address: string;
    if (hexAddress.length === 42) {
        address = hexAddress.slice(2);
    } else {
        address = hexAddress;
    }

    if (address.length !== 40) {
        throw new Error("expecting a 20 bytes long hex string");
    }

    if (isContract) {
        address = `1${address}`;
    }

    return `0x${address.padStart(64, "0")}`;
}