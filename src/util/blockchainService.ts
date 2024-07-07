import { ethers } from "ethers";
import rpcUrls from "../config/rpcUrls";
import abi from "../config/abi";
import {Protocol} from "../models/collectionModel";

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

export const getContract = (options: BlockchainServiceOptions): ethers.Contract => {
    const { protocol, address, networkId } = options;
    const provider = getProvider(networkId);
    const contractAbi = abi[protocol];
    if (!contractAbi) {
        throw new Error(`No ABI found for protocol: ${protocol}`);
    }
    return new ethers.Contract(address, contractAbi, provider);
}
