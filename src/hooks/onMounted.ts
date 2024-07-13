import addColleciton1155Listener from "../listener/collection1155Listener";
import addColleciton721Listener from "../listener/collection721Listener";
import addMarketplaceListener from "../listener/marketplaceListener";
import Collection, { Protocol } from "../models/collectionModel";
import Marketplace from "../models/marketplaceModel";

const onMounted = async () => {
    const collectionList = await Collection.find({}).populate("deployedAt", "networkId");
    collectionList.forEach(collection => {
        if (collection.protocol === Protocol.ERC721) {
            addColleciton721Listener(collection.address, collection.deployedAt.networkId);
        }
        if (collection.protocol === Protocol.ERC1155) {
            addColleciton1155Listener(collection.address, collection.deployedAt.networkId)
        }
    })

    const marketplaceList = await Marketplace.find({}).populate("network", "networkId");
    marketplaceList.forEach(marketplace => {
        addMarketplaceListener(marketplace.address, marketplace.network.networkId)
    })
}

export default onMounted;