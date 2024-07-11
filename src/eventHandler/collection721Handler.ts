import Collection, { ICollection } from "../models/collectionModel";
import Airdrop from "../models/airdropModel";
import { blockTimeToDate } from "../util/blockchainService";
import NFT from "../models/nftModel";
import { findOrCreateUser } from "../controller/userController";

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

const createNFT = async (tokenId: string, collection: ICollection, holderAddress: string) => {
    const owner = await findOrCreateUser(holderAddress);

    return new NFT({
        tokenId,
        amount: 1,
        owner,
        fromCollection: collection,
    });
};

export const tokenMinted = async (address: string, tokenId: bigint, amount: bigint, holder: string) => {
    const collection = await Collection.findOne({ address: address.toLocaleLowerCase() });

    if (!collection) {
        throw new Error(`Invalid Collection ${address}`)
    }

    const createNFTPromises = [];
    for (let i = 0; i < amount; i++) {
        const _tokenId = (tokenId + BigInt(i)).toString();
        createNFTPromises.push(createNFT(_tokenId, collection, holder));
    }

    const newNFTs = await Promise.all(createNFTPromises);
    await NFT.insertMany(newNFTs);
}