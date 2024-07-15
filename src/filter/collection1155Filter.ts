import { getBlockNumber, getContract } from "../util/blockchainService"
import { Protocol } from "../models/collectionModel";
import { Collection1155 } from "../types";
import { crosschainAddressSet, tokenBurned, tokenMinted } from "../eventHandler/collection1155Handler";
import { findOrCreateCollection, getEndBlock } from "./collection721Filter";
import TransactionHashCache from "../util/transactionHash";
import logger from "../util/logger";

const startPolling1155 = async (address: string, networkId: number) => {
    console.log(`start polling for ${address}`);
    const contract = getContract({ protocol: Protocol.ERC1155, address, networkId }) as Collection1155;

    const collection = await findOrCreateCollection(address, contract, networkId, Protocol.ERC1155);

    const transactionHashCache = new TransactionHashCache(100);
    await transactionHashCache.loadFromDatabase(address);
    setInterval(async () => {
        const startTime = Date.now();
        const currentBlock = await getBlockNumber(networkId);
        // filter all required events
        const endBlock = getEndBlock(collection.lastFilterBlock, currentBlock);

        const tokenMintedEvents = await contract.queryFilter(contract.filters.TokenMinted, collection.lastFilterBlock, endBlock);
        for (const event of tokenMintedEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await tokenMinted.bind(null, address).apply(null, event.args);
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

export default startPolling1155;