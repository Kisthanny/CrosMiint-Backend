import Collection, { ICollection } from "../models/collectionModel";
import Airdrop from "../models/airdropModel";
import { blockTimeToDate } from "../util/blockchainService";
import NFT, { MetadataType } from "../models/nftModel";
import { findOrCreateUser } from "../controller/userController";
import { Types } from "mongoose";
import Network from "../models/networkModel";

export const getCollection = async (address: string, networkId: number) => {
    const network = await Network.findOne({ networkId });
    if (!network) {
        throw new Error(`Invalid network ${networkId}`)
    }

    const collection = await Collection.findOne({
        address: address.toLocaleLowerCase(),
        deployedAt: network._id,
    });

    if (!collection) {
        throw new Error(`Invalid Collection ${address}`)
    }

    return collection;
}

export const dropCreated = async (
    address: string,
    networkId: number,
    dropId: bigint,
    supply: bigint,
    mintLimitPerWallet: bigint,
    startTime: bigint,
    endTime: bigint,
    price: bigint,
    hasWhiteListPhase: boolean,
    whiteListEndTime: bigint,
    whiteListPrice: bigint,
) => {
    const collection = await getCollection(address, networkId);

    const airdrop = await Airdrop.create({
        fromCollection: collection,
        dropIndex: dropId.toString(),
        supply: supply.toString(),
        minted: "0",
        startTime: blockTimeToDate(startTime),
        endTime: blockTimeToDate(endTime),
        price: price.toString(),
        hasWhiteListPhase,
        whiteListEndTime: blockTimeToDate(whiteListEndTime),
        whiteListPrice: whiteListPrice.toString(),
        mintLimitPerWallet: mintLimitPerWallet.toString(),
    })

    collection.airdrops.push(airdrop);
    await collection.save();
}

const createNFT = async (tokenId: string, collection: ICollection, userId: Types.ObjectId) => {
    return new NFT({
        tokenId,
        amount: 1,
        owners: [{
            owner: userId,
            amount: 1,
        }],
        fromCollection: collection,
    });
};

export const tokenMinted = async (address: string, networkId: number, tokenId: bigint, amount: bigint, holderAddress: string, isFromDrop: boolean) => {
    const collection = await getCollection(address, networkId);

    if (!collection) {
        throw new Error(`Invalid Collection ${address}`)
    }

    const holder = await findOrCreateUser(holderAddress);

    const createNFTPromises = [];
    for (let i = 0; BigInt(i) < amount; i++) {
        const _tokenId = (tokenId + BigInt(i)).toString();
        createNFTPromises.push(createNFT(_tokenId, collection, holder._id as Types.ObjectId));
    }

    const newNFTs = await Promise.all(createNFTPromises);
    await NFT.insertMany(newNFTs);

    if (!isFromDrop) {
        return;
    }
    const latestDrop = await Airdrop.find({
        fromCollection: collection._id,
    }).sort({ createdAt: -1 }).findOne();

    if (!latestDrop) {
        throw new Error("Invalid latest Airdrop");
    }
    latestDrop.minted = (BigInt(latestDrop.minted) + amount).toString();
    await latestDrop.save();
}

export const baseURISet = async (address: string, networkId: number, baseURI: string) => {
    const collection = await getCollection(address, networkId);

    if (!collection) {
        throw new Error(`Invalid Collection ${address}`)
    }

    collection.baseURI = baseURI;
    await collection.save()

    const nftList = await NFT.find({ fromCollection: collection._id });

    const bulkOps = nftList.map(nft => ({
        updateOne: {
            filter: { _id: nft._id },
            update: {
                $set: {
                    tokenURI: `${baseURI}/${nft.tokenId}.json`,
                    metadataType: MetadataType.Image
                }
            }
        }
    }));

    await NFT.bulkWrite(bulkOps);
}

export const tokenBurned = async (address: string, networkId: number, tokenId: bigint, burner: string) => {
    const collection = await getCollection(address, networkId);

    if (!collection) {
        throw new Error(`Invalid Collection ${address}`)
    }

    await NFT.findOneAndDelete({ fromCollection: collection._id, tokenId: tokenId.toString() })
}

export const crosschainAddressSet = async (address: string, networkId: number, network: bigint, contractAddress: string) => {
    const collection = await getCollection(address, networkId);

    if (!collection) {
        throw new Error(`Invalid Collection ${address}`)
    }

    collection.networks.push({
        networkId: Number(network),
        networkCollection: contractAddress,
    })

    await collection.save();
}