import { getContract } from "../util/blockchainService"
import Collection, { Protocol } from "../models/collectionModel";
import { Collection721 } from "../types";
import { dropCreated, tokenMinted } from "../eventHandler/collection721Handler";
import { findOrCreateUser } from "../controller/userController";
import Network from "../models/networkModel";

const findOrCreateCollection = async (address: string, contract: Collection721, networkId: number | string, networks: { networkId: number; networkCollection: string }[]) => {
    try {
        const exist = await Collection.exists({ address });

        if (exist) {
            return;
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

        await Collection.create({
            address,
            owner: user,
            logoURI,
            name,
            symbol,
            isBase,
            networks,
            deployedAt: network,
            protocol: Protocol.ERC721,
        })
    } catch (error) {
        console.error(error);
        if ((error as Error).message.includes("Network")) {
            await findOrCreateCollection(address, contract, networkId, networks);
        }
    }
}

const addColleciton721Listener = async (address: string, networkId: number, networks: { networkId: number; networkCollection: string }[]) => {
    const contract = getContract({ protocol: Protocol.ERC721, address, networkId }) as Collection721;

    await findOrCreateCollection(address, contract, networkId, networks);

    contract.addListener("DropCreated", dropCreated.bind(null, address));

    contract.addListener("TokenMinted", tokenMinted.bind(null, address));

    contract.addListener("BaseURISet", () => { });

    contract.addListener("TokenBurned", () => { });

    contract.addListener("CrosschainTransferInitiated", () => { });

    contract.addListener("CrosschainAddressSet", () => { });

    console.log(`listeners added to ${address}`)
}

export default addColleciton721Listener;