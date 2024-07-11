import addColleciton721Listener from "../listener/collection721Listener";
import Collection from "../models/collectionModel";

const onMounted = async () => {
    const collectionList = await Collection.find({}).populate("deployedAt", "networkId");
    collectionList.forEach(collection => {
        addColleciton721Listener(collection.address, collection.deployedAt.networkId, collection.networks);
    })
}

export default onMounted;