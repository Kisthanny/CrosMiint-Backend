import Collection from "../models/collectionModel";
import NFT, { MetadataType } from "../models/nftModel";
import { findOrCreateUser } from "../controller/userController";

export const tokenMinted = async (address: string, tokenId: bigint, tokenURI: string, amount: bigint, holder: string) => {
    const collection = await Collection.findOne({ address: address.toLocaleLowerCase() });

    if (!collection) {
        throw new Error(`Invalid Collection ${address}`)
    }

    const owner = await findOrCreateUser(holder);

    const nft = await NFT.findOne({ fromCollection: collection._id, tokenId: tokenId.toString() });
    if (nft) {
        nft.amount = (BigInt(nft.amount) + amount).toString();
        await nft.save();
    } else {
        await NFT.create({
            tokenId: tokenId.toString(),
            tokenURI,
            amount: amount.toString(),
            owner,
            fromCollection: collection,
            metadataType: MetadataType.Image,
        });
    }
}

export const tokenBurned = async (address: string, tokenId: bigint, amount: bigint) => {
    const collection = await Collection.findOne({ address: address.toLocaleLowerCase() });

    if (!collection) {
        throw new Error(`Invalid Collection ${address}`)
    }

    const nft = await NFT.findOne({ fromCollection: collection._id, tokenId: tokenId.toString() });
    if (!nft) {
        throw new Error(`Invalid NFT ${address}/${tokenId}`);
    }

    nft.amount = (BigInt(nft.amount) - amount).toString();

    await nft.save();
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