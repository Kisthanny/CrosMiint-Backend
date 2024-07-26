import { getBlockNumber, getContract } from "../util/blockchainService"
import Collection, { Protocol } from "../models/collectionModel";
import { Collection721, Collection1155 } from "../types";
import { baseURISet, crosschainAddressSet, dropCreated, tokenBurned, tokenMinted } from "../eventHandler/collection721Handler";
import { findOrCreateUser } from "../controller/userController";
import Network from "../models/networkModel";
import TransactionHashCache from "../util/transactionHash";
import logger from "../util/logger";
import { retry } from "../util/retry";
import { createGroup, CreateGroupRes } from "../controller/metadataController";

export const findOrCreateCollection = async (address: string, contract: Collection721 | Collection1155, networkId: number | string, protocol: Protocol) => {
    const network = await Network.findOne({ networkId });
    const collection = await Collection.findOne({ address, deployedAt: network?._id });

    if (collection) {
        return collection;
    }

    const promiseList =
        [
            retry(contract.owner),
            retry(contract.name),
            retry(contract.symbol),
            retry(contract.logoURI),
            retry(contract.isBase),
        ]

    const [owner, name, symbol, logoURI, isBase] = await Promise.all(promiseList);

    const secondPromiseList: Promise<any>[] = [
        findOrCreateUser(owner as string),
        getBlockNumber(Number(networkId)),
    ]

    if (isBase) {
        secondPromiseList.push(createGroup(address as string))
    }

    const results = await Promise.all(secondPromiseList);

    const [user, block] = results;
    const createGroupRes = isBase ? (results[2] as CreateGroupRes) : undefined;

    const collectionDoc = await Collection.create({
        address,
        owner: user,
        logoURI: `${process.env.PINATA_GATEWAY!}${logoURI}`,
        name,
        symbol,
        isBase,
        networks: [],
        deployedAt: network,
        lastFilterBlock: (block as number) - 10,
        protocol,
        airdrops: [],
        ipfsGroupId: isBase ? createGroupRes?.id : undefined, // Conditionally add ipfsGroupId
    });

    return collectionDoc;
}

export const getEndBlock = (startBlock: number, currentBlock: number) => {
    if (currentBlock - startBlock < 30) {
        logger("up to date");
        return currentBlock;
    } else {
        logger(`remaining unfiltered blocks: ${currentBlock - startBlock}`, "unfilteredBlocks");
        return startBlock + 30;
    }
}

const startPolling721 = async (address: string, networkId: number) => {
    console.log(`start polling for ${address}`);
    const contract = getContract({ protocol: Protocol.ERC721, address, networkId }) as Collection721;

    const collection = await findOrCreateCollection(address, contract, networkId, Protocol.ERC721);

    const transactionHashCache = new TransactionHashCache(100);
    await transactionHashCache.loadFromDatabase(address);
    setInterval(async () => {
        const startTime = Date.now();
        const currentBlock = await getBlockNumber(networkId);
        // filter all required events
        const endBlock = getEndBlock(collection.lastFilterBlock, currentBlock);

        const dropCreatedEvents = await retry(() => contract.queryFilter(contract.filters.DropCreated, collection.lastFilterBlock, endBlock));
        for (const event of dropCreatedEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await dropCreated.bind(null, address, networkId).apply(null, event.args);
            }
        }

        const tokenMintedEvents = await retry(() => contract.queryFilter(contract.filters.TokenMinted, collection.lastFilterBlock, endBlock));
        for (const event of tokenMintedEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await tokenMinted.bind(null, address, networkId).apply(null, event.args);
            }
        }

        const baseURISetEvents = await retry(() => contract.queryFilter(contract.filters.BaseURISet, collection.lastFilterBlock, endBlock));
        for (const event of baseURISetEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await baseURISet.bind(null, address, networkId).apply(null, event.args);
            }
        }

        const tokenBurnedEvents = await retry(() => contract.queryFilter(contract.filters.TokenBurned, collection.lastFilterBlock, endBlock));
        for (const event of tokenBurnedEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await tokenBurned.bind(null, address, networkId).apply(null, event.args);
            }
        }

        const crosschainAddressSetEvents = await retry(() => contract.queryFilter(contract.filters.CrosschainAddressSet, collection.lastFilterBlock, endBlock));
        for (const event of crosschainAddressSetEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await crosschainAddressSet.bind(null, address, networkId).apply(null, event.args);
            }
        }

        // update lastFilterBlock
        collection.lastFilterBlock = endBlock;
        await collection.save();
        logger(`time consumed for a round of polling ${Date.now() - startTime}`);
    }, 60000);
}

export default startPolling721;