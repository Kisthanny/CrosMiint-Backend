import { getContract } from "../util/blockchainService"
import Collection, { Protocol } from "../models/collectionModel";
import { Collection1155 } from "../types";
import { crosschainAddressSet, tokenBurned, tokenMinted } from "../eventHandler/collection1155Handler";
import { findOrCreateUser } from "../controller/userController";
import Network from "../models/networkModel";

const findOrCreateCollection = async (address: string, contract: Collection1155, networkId: number | string) => {
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
            networks: [],
            deployedAt: network,
            protocol: Protocol.ERC1155,
        })
    } catch (error) {
        console.error(error);
        if ((error as Error).message.includes("Network")) {
            await findOrCreateCollection(address, contract, networkId);
        }
    }
}

const addColleciton1155Listener = async (address: string, networkId: number) => {
    const contract = getContract({ protocol: Protocol.ERC1155, address, networkId }) as Collection1155;

    await findOrCreateCollection(address, contract, networkId);

    contract.addListener("TokenMinted", tokenMinted.bind(null, address));

    contract.addListener("TokenBurned", tokenBurned.bind(null, address));

    contract.addListener("CrosschainTransferInitiated", () => { });

    contract.addListener("CrosschainAddressSet", crosschainAddressSet.bind(null, address));

    console.log(`listeners added to ${address}`);
}

export default addColleciton1155Listener;