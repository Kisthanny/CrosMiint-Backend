import Collection, { ICollection } from "../models/collectionModel";
import Airdrop from "../models/airdropModel";
import { blockTimeToDate } from "../util/blockchainService";
import NFT, { MetadataType } from "../models/nftModel";
import { findOrCreateUser } from "../controller/userController";
import { Types } from "mongoose";

export const dropCreated = async (
    address: string,
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
    const collection = await Collection.findOne({ address: address.toLocaleLowerCase() });

    await Airdrop.create({
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

export const tokenMinted = async (address: string, tokenId: bigint, amount: bigint, holderAddress: string) => {
    const collection = await Collection.findOne({ address: address.toLocaleLowerCase() });

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
}

export const baseURISet = async (address: string, baseURI: string) => {
    const collection = await Collection.findOne({ address: address.toLocaleLowerCase() });

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
                    tokenURI: `${baseURI}/metadata/${nft.tokenId}`,
                    metadataType: MetadataType.Image
                }
            }
        }
    }));

    await NFT.bulkWrite(bulkOps);
}

export const tokenBurned = async (address: string, tokenId: bigint, burner: string) => {
    const collection = await Collection.findOne({ address: address.toLocaleLowerCase() });

    if (!collection) {
        throw new Error(`Invalid Collection ${address}`)
    }

    await NFT.findOneAndDelete({ fromCollection: collection._id, tokenId: tokenId.toString() })
}

export const crosschainAddressSet = async (address: string, network: bigint, contractAddress: string) => {
    const collection = await Collection.findOne({ address: address.toLocaleLowerCase() });

    if (!collection) {
        throw new Error(`Invalid Collection ${address}`)
    }

    collection.networks.push({
        networkId: Number(network),
        networkCollection: contractAddress,
    })

    await collection.save();
}