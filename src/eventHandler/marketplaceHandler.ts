import Collection, { ICollection } from "../models/collectionModel";
import Airdrop from "../models/airdropModel";
import { blockTimeToDate } from "../util/blockchainService";
import NFT, { MetadataType } from "../models/nftModel";
import { findOrCreateUser } from "../controller/userController";
import Listing, { ListingStatus } from "../models/ListingModel";
import Network from "../models/networkModel";
import { Types } from "mongoose";

export const listed = async (
    listingId: bigint,
    sellerAddress: string,
    contractAddress: string,
    tokenId: bigint,
    amount: bigint,
    price: bigint,
    tokenType: bigint,
) => {
    const seller = await findOrCreateUser(sellerAddress);

    const collection = await Collection.findOne({ address: contractAddress.toLocaleLowerCase() });
    if (!collection) {
        throw new Error(`Invalid Collection ${contractAddress}`);
    }

    const nft = await NFT.findOne({ fromCollection: collection._id, tokenId: tokenId.toString() });
    if (!nft) {
        throw new Error(`Invalid NFT ${contractAddress}/${tokenId}`)
    }

    await Listing.create({
        listingId: listingId.toString(),
        seller,
        price: price.toString(),
        nft,
        status: ListingStatus.Listed,
        listAmount: amount.toString(),
        offers: [],
        network: collection.deployedAt,
    })
}

export const cancelled = async (networkId: number, listingId: bigint) => {
    const network = await Network.findOne({ networkId });
    if (!network) {
        throw new Error(`Invalid Network ${network}`);
    }

    const listing = await Listing.findOne({
        network,
        listingId: listingId.toString(),
    })
    if (!listing) {
        throw new Error(`Invalid Listing ${network.chainName}/${listing}`)
    }

    listing.status = ListingStatus.Canceled;
    await listing.save();
}

export const bought = async (
    networkId: number,
    listingId: bigint,
    buyerAddress: string,
    price: bigint,
    amount: bigint,
) => {
    const network = await Network.findOne({ networkId });
    if (!network) {
        throw new Error(`Invalid Network ${network}`);
    }

    const listing = await Listing.findOne({
        network,
        listingId: listingId.toString(),
    })
    if (!listing) {
        throw new Error(`Invalid Listing ${network.chainName}/${listing}`)
    }

    const nft = await NFT.findById(listing.nft);
    if (!nft) {
        throw new Error(`Invalid nft ${listing.nft}`);
    }

    // update listing doc
    listing.listAmount = (BigInt(listing.listAmount) - amount).toString();
    if (Number(listing.listAmount) === 0) {
        listing.status = ListingStatus.Sold;
    }

    // update nft doc
    const sellerId = listing.seller as Types.ObjectId;
    const buyer = await findOrCreateUser(buyerAddress.toLocaleLowerCase());
    const buyerId = buyer._id as Types.ObjectId;

    // Update seller's amount
    const sellerEntry = nft.owners.find(owner => (owner.owner as Types.ObjectId).toString() === sellerId.toString());
    if (!sellerEntry) {
        throw new Error(`Seller does not own this NFT`);
    }

    const newSellerAmount = BigInt(sellerEntry.amount) - amount;
    if (newSellerAmount < 0) {
        throw new Error(`Seller does not have enough amount of NFT to sell`);
    }
    sellerEntry.amount = newSellerAmount.toString();

    // Remove seller entry if the new amount is zero
    if (newSellerAmount === BigInt(0)) {
        nft.owners = nft.owners.filter(owner => (owner.owner as Types.ObjectId).toString() !== sellerId.toString());
    }

    // Update buyer's amount
    const buyerEntry = nft.owners.find(owner => (owner.owner as Types.ObjectId).toString() === buyerId.toString());
    if (buyerEntry) {
        buyerEntry.amount = (BigInt(buyerEntry.amount) + amount).toString();
    } else {
        nft.owners.push({ owner: buyerId, amount: amount.toString() });
    }

    await listing.save();
    await nft.save();
}