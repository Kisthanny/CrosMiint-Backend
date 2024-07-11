import NFTMarketplace from "../../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";
import Collection721 from "../../artifacts/contracts/Collection721.sol/Collection721.json"
import Collection1155 from "../../artifacts/contracts/Collection1155.sol/Collection1155.json"
const abi = {
    Collection721: Collection721.abi,
    NFTMarketplace: NFTMarketplace.abi,
    Collection1155: Collection1155.abi,
}

export default abi;