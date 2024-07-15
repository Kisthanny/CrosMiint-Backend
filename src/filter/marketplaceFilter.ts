import { getBlockNumber, getMarketplaceContract } from "../util/blockchainService"
import { NFTMarketplace } from "../types";
import Network from "../models/networkModel";
import Marketplace from "../models/marketplaceModel";
import { bought, cancelled, listed, offerAccepted, offerCancelled, offerMade } from "../eventHandler/marketplaceHandler";
import { getEndBlock, TransactionHashCache } from "./collection721Filter";

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

const addMarketplaceListener = async (address: string, networkId: number) => {
    const contract = getMarketplaceContract(address, networkId);

    await findOrCreateMarketplace(address, networkId);

    contract.addListener("Listed", listed);

    contract.addListener("Cancelled", cancelled.bind(null, networkId));

    contract.addListener("Bought", bought.bind(null, networkId));

    contract.addListener("OfferMade", offerMade.bind(null, networkId));

    contract.addListener("OfferAccepted", offerAccepted.bind(null, networkId));

    contract.addListener("OfferCancelled", offerCancelled.bind(null, networkId));

    console.log(`listeners added to ${address}`);
}

const startPollingMarketplace = async (address: string, networkId: number) => {
    const contract = getMarketplaceContract(address, networkId);

    const marketplace = await findOrCreateMarketplace(address, networkId);

    const transactionHashCache = new TransactionHashCache(100);
    setInterval(async () => {
        const currentBlock = await getBlockNumber(networkId);
        // filter all required events
        const endBlock = getEndBlock(marketplace.lastFilterBlock, currentBlock);

        const listedEvents = await contract.queryFilter(contract.filters.Listed, marketplace.lastFilterBlock, endBlock);
        for (const event of listedEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                console.log(`new event: ${event.eventName}`);
                transactionHashCache.add(txHash);
                await listed.apply(null, event.args);
            }
        }

        const cancelledEvents = await contract.queryFilter(contract.filters.Cancelled, marketplace.lastFilterBlock, endBlock);
        for (const event of cancelledEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                console.log(`new event: ${event.eventName}`);
                transactionHashCache.add(txHash);
                await cancelled.bind(null, networkId).apply(null, event.args);
            }
        }

        const boughtEvents = await contract.queryFilter(contract.filters.Bought, marketplace.lastFilterBlock, endBlock);
        for (const event of boughtEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                console.log(`new event: ${event.eventName}`);
                transactionHashCache.add(txHash);
                await bought.bind(null, networkId).apply(null, event.args);
            }
        }

        const offerMadeEvents = await contract.queryFilter(contract.filters.OfferMade, marketplace.lastFilterBlock, endBlock);
        for (const event of offerMadeEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                console.log(`new event: ${event.eventName}`);
                transactionHashCache.add(txHash);
                await offerMade.bind(null, networkId).apply(null, event.args);
            }
        }

        const offerAcceptedEvents = await contract.queryFilter(contract.filters.OfferAccepted, marketplace.lastFilterBlock, endBlock);
        for (const event of offerAcceptedEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                console.log(`new event: ${event.eventName}`);
                transactionHashCache.add(txHash);
                await offerAccepted.bind(null, networkId).apply(null, event.args);
            }
        }

        const offerCancelledEvents = await contract.queryFilter(contract.filters.OfferCancelled, marketplace.lastFilterBlock, endBlock);
        for (const event of offerCancelledEvents) {
            const txHash = event.transactionHash;
            if (!transactionHashCache.has(txHash)) {
                console.log(`new event: ${event.eventName}`);
                transactionHashCache.add(txHash);
                await offerCancelled.bind(null, networkId).apply(null, event.args);
            }
        }

        // update lastFilterBlock
        marketplace.lastFilterBlock = endBlock;
        await marketplace.save();
    }, 60000);
}

export default startPollingMarketplace;