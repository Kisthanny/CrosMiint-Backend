import { getBlockNumber, getContract } from "../util/blockchainService"
import Collection, { Protocol } from "../models/collectionModel";
import { Collection721, Collection1155 } from "../types";
import { baseURISet, crosschainAddressSet, dropCreated, tokenBurned, tokenMinted } from "../eventHandler/collection721Handler";
import { findOrCreateUser } from "../controller/userController";
import Network from "../models/networkModel";
import TransactionHashCache from "../util/transactionHash";
import logger from "../util/logger";

export const findOrCreateCollection = async (address: string, contract: Collection721 | Collection1155, networkId: number | string, protocol: Protocol) => {
    const collection = await Collection.findOne({ address });

    if (collection) {
        return collection;
    }

    const promiseList =
        [
            contract.owner(),
            contract.name(),
            contract.symbol(),
            contract.logoURI(),
            contract.isBase(),
        ]

    const [owner, name, symbol, logoURI, isBase] = await Promise.all(promiseList);

    const user = await findOrCreateUser(owner as string);

    const network = await Network.findOne({ networkId });

    const block = await getBlockNumber(Number(networkId));

    return await Collection.create({
        address,
        owner: user,
        logoURI,
        name,
        symbol,
        isBase,
        networks: [],
        deployedAt: network,
        lastFilterBlock: block - 10,
        protocol,
    })
}

export const getEndBlock = (startBlock: number, currentBlock: number) => {
    if (currentBlock - startBlock < 30) {
        return currentBlock;
    } else {
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

        const dropCreatedEvents = await contract.queryFilter(contract.filters.DropCreated, collection.lastFilterBlock, endBlock);
        for (const event of dropCreatedEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await dropCreated.bind(null, address).apply(null, event.args);
            }
        }

        const tokenMintedEvents = await contract.queryFilter(contract.filters.TokenMinted, collection.lastFilterBlock, endBlock);
        for (const event of tokenMintedEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await tokenMinted.bind(null, address).apply(null, event.args);
            }
        }

        const baseURISetEvents = await contract.queryFilter(contract.filters.BaseURISet, collection.lastFilterBlock, endBlock);
        for (const event of baseURISetEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await baseURISet.bind(null, address).apply(null, event.args);
            }
        }

        const tokenBurnedEvents = await contract.queryFilter(contract.filters.TokenBurned, collection.lastFilterBlock, endBlock);
        for (const event of tokenBurnedEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await tokenBurned.bind(null, address).apply(null, event.args);
            }
        }

        const crosschainAddressSetEvents = await contract.queryFilter(contract.filters.CrosschainAddressSet, collection.lastFilterBlock, endBlock);
        for (const event of crosschainAddressSetEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await crosschainAddressSet.bind(null, address).apply(null, event.args);
            }
        }

        // update lastFilterBlock
        collection.lastFilterBlock = endBlock;
        await collection.save();
        logger(`time consumed for a round of polling ${Date.now() - startTime}`);
    }, 60000);
}

export default startPolling721;