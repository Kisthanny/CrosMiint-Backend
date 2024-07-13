import { getMarketplaceContract } from "../util/blockchainService"
import { NFTMarketplace } from "../types";
import Network from "../models/networkModel";
import Marketplace from "../models/marketplaceModel";
import { bought, cancelled, listed } from "../eventHandler/marketplaceHandler";

const findOrCreateMarketplace = async (address: string, contract: NFTMarketplace, networkId: number | string) => {
    const exist = await Marketplace.exists({ address });

    if (exist) {
        return;
    }

    const network = await Network.findOne({ networkId });

    await Marketplace.create({
        address,
        network,
    })
}

const addMarketplaceListener = async (address: string, networkId: number) => {
    const contract = getMarketplaceContract(address, networkId);

    await findOrCreateMarketplace(address, contract, networkId);

    contract.addListener("Listed", listed);

    contract.addListener("Cancelled", cancelled.bind(null, networkId));

    contract.addListener("Bought", bought.bind(null, networkId));

    contract.addListener("OfferMade", () => { });

    contract.addListener("OfferAccepted", () => { });

    contract.addListener("OfferCancelled", () => { });

    console.log(`listeners added to ${address}`);
}

export default addMarketplaceListener;