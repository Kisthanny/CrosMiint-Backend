import Collection from "../models/collectionModel";
import NFT, { MetadataType } from "../models/nftModel";
import { findOrCreateUser } from "../controller/userController";
import { Types } from "mongoose";

export const tokenMinted = async (address: string, tokenId: bigint, tokenURI: string, amount: bigint, holder: string) => {
    const collection = await Collection.findOne({ address: address.toLocaleLowerCase() });

    if (!collection) {
        throw new Error(`Invalid Collection ${address}`);
    }

    const user = await findOrCreateUser(holder.toLocaleLowerCase());

    const nft = await NFT.findOne({ fromCollection: collection._id, tokenId: tokenId.toString() });

    if (nft) {
        // Find the owner entry in nft.owners array for the user
        const ownerEntry = nft.owners.find(owner => (owner.owner as Types.ObjectId).toString() === (user._id as Types.ObjectId).toString());

        if (ownerEntry) {
            // Update the amount for the existing owner
            ownerEntry.amount = (BigInt(ownerEntry.amount) + amount).toString();
        } else {
            // Add a new owner entry
            nft.owners.push({ owner: user._id, amount: amount.toString() });
        }

        await nft.save();
    } else {
        // Create a new NFT entry with the initial owner
        await NFT.create({
            tokenId: tokenId.toString(),
            tokenURI,
            amount: amount.toString(),
            owners: [{ owner: user._id, amount: amount.toString() }],
            fromCollection: collection._id,
            metadataType: MetadataType.Image,
        });
    }
};

export const tokenBurned = async (contractAddress: string, tokenId: bigint, amount: bigint, senderAddress: string) => {
    const collection = await Collection.findOne({ address: contractAddress.toLocaleLowerCase() });

    if (!collection) {
        throw new Error(`Invalid Collection ${contractAddress}`);
    }

    const nft = await NFT.findOne({ fromCollection: collection._id, tokenId: tokenId.toString() });
    if (!nft) {
        throw new Error(`Invalid NFT ${contractAddress}/${tokenId}`);
    }

    const user = await findOrCreateUser(senderAddress.toLocaleLowerCase());

    // Find the owner entry in nft.owners array for the user
    const ownerEntry = nft.owners.find(owner => (owner.owner as Types.ObjectId).toString() === (user._id as Types.ObjectId).toString());

    if (!ownerEntry) {
        throw new Error(`User ${senderAddress} does not own any amount of NFT ${contractAddress}/${tokenId}`);
    }

    // Update the amount for the user
    const newAmount = BigInt(ownerEntry.amount) - amount;

    if (newAmount < 0) {
        throw new Error(`Burn amount exceeds the user's balance for NFT ${contractAddress}/${tokenId}`);
    }

    ownerEntry.amount = newAmount.toString();

    // Remove the owner entry if the new amount is zero
    if (newAmount === BigInt(0)) {
        nft.owners = nft.owners.filter(owner => (owner.owner as Types.ObjectId).toString() !== (user._id as Types.ObjectId).toString());
    }

    await nft.save();
};

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