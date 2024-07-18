import startPolling1155 from "../filter/collection1155Filter";
import startPolling721 from "../filter/collection721Filter";
import startPollingMarketplace from "../filter/marketplaceFilter";
import Collection, { Protocol } from "../models/collectionModel";
import Marketplace from "../models/marketplaceModel";
import { sleep } from "../util/retry";

const onMounted = async () => {
    const collectionList = await Collection.find({}).populate("deployedAt", "networkId");
    collectionList.forEach(async (collection, index) => {
        await sleep(60000 / collectionList.length * index);
        if (collection.protocol === Protocol.ERC721) {
            startPolling721(collection.address, collection.deployedAt.networkId);
        }
        if (collection.protocol === Protocol.ERC1155) {
            startPolling1155(collection.address, collection.deployedAt.networkId)
        }
    })

    const marketplaceList = await Marketplace.find({}).populate("network", "networkId");
    marketplaceList.forEach(async (marketplace, index) => {
        await sleep(60000 / marketplaceList.length * index);
        startPollingMarketplace(marketplace.address, marketplace.network.networkId)
    })
}

export default onMounted;