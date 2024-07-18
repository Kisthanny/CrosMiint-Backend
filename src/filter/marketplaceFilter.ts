import { getBlockNumber, getMarketplaceContract } from "../util/blockchainService"
import Network from "../models/networkModel";
import Marketplace from "../models/marketplaceModel";
import { bought, cancelled, listed, offerAccepted, offerCancelled, offerMade } from "../eventHandler/marketplaceHandler";
import { getEndBlock } from "./collection721Filter";
import TransactionHashCache from "../util/transactionHash";
import logger from "../util/logger";
import { retry } from "../util/retry";

const findOrCreateMarketplace = async (address: string, networkId: number | string) => {
    const marketplace = await Marketplace.findOne({ address });

    if (marketplace) {
        return marketplace;
    }

    const network = await Network.findOne({ networkId });

    const block = await getBlockNumber(Number(networkId));

    return await Marketplace.create({
        address,
        network,
        lastFilterBlock: block - 10,
    })
}

const startPollingMarketplace = async (address: string, networkId: number) => {
    console.log(`start polling for ${address}`);
    const contract = getMarketplaceContract(address, networkId);

    const marketplace = await findOrCreateMarketplace(address, networkId);

    const transactionHashCache = new TransactionHashCache(100);
    await transactionHashCache.loadFromDatabase(address);
    setInterval(async () => {
        const startTime = Date.now();
        const currentBlock = await getBlockNumber(networkId);
        // filter all required events
        const endBlock = getEndBlock(marketplace.lastFilterBlock, currentBlock);

        const listedEvents = await retry(() => contract.queryFilter(contract.filters.Listed, marketplace.lastFilterBlock, endBlock));
        for (const event of listedEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await listed.apply(null, event.args);
            }
        }

        const cancelledEvents = await retry(() => contract.queryFilter(contract.filters.Cancelled, marketplace.lastFilterBlock, endBlock));
        for (const event of cancelledEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await cancelled.bind(null, networkId).apply(null, event.args);
            }
        }

        const boughtEvents = await retry(() => contract.queryFilter(contract.filters.Bought, marketplace.lastFilterBlock, endBlock));
        for (const event of boughtEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await bought.bind(null, networkId).apply(null, event.args);
            }
        }

        const offerMadeEvents = await retry(() => contract.queryFilter(contract.filters.OfferMade, marketplace.lastFilterBlock, endBlock));
        for (const event of offerMadeEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await offerMade.bind(null, networkId).apply(null, event.args);
            }
        }

        const offerAcceptedEvents = await retry(() => contract.queryFilter(contract.filters.OfferAccepted, marketplace.lastFilterBlock, endBlock));
        for (const event of offerAcceptedEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName}`);
                transactionHashCache.add(address, txHash);
                await offerAccepted.bind(null, networkId).apply(null, event.args);
            }
        }

        const offerCancelledEvents = await retry(() => contract.queryFilter(contract.filters.OfferCancelled, marketplace.lastFilterBlock, endBlock));
        for (const event of offerCancelledEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                logger(`new event: ${event.eventName} ${txHash}`);
                transactionHashCache.add(address, txHash);
                await offerCancelled.bind(null, networkId).apply(null, event.args);
            }
        }

        // update lastFilterBlock
        marketplace.lastFilterBlock = endBlock;
        await marketplace.save();
        logger(`time consumed for a round of polling ${Date.now() - startTime}`);
    }, 60000);
}

export default startPollingMarketplace;