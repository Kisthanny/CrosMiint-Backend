import expressAsyncHandler from "express-async-handler";
import { convertObjWithBigInt, getReceipt, getTransaction, stringifyWithBigInt } from "../util/blockchainService";
import { ethers } from "ethers";
import abi from "../config/abi";

export const analyzeHash = expressAsyncHandler(async (req, res, next) => {
    const { txHash, networkId, abiType } = req.query;

    if (!txHash || !networkId || !abiType) {
        res.status(400);
        throw new Error("missing argument");
    }
    const [transaction, receipt] = await Promise.all([
        getTransaction(txHash as string, Number(networkId)),
        getReceipt(txHash as string, Number(networkId)),
    ])

    if (transaction && transaction.to) {
        const abiInterface = {
            0: abi.Collection721,
            1: abi.Collection1155,
            2: abi.NFTMarketplace,
        }[Number(abiType)]
        if (!abiInterface) {
            res.status(400);
            throw new Error(`Invalid abiType ${abiType}`)
        }
        const contractInterface = new ethers.Interface(abiInterface);

        const parsedTransaction = contractInterface.parseTransaction({
            data: transaction.data,
            value: transaction.value,
        });
        res.status(200).json(convertObjWithBigInt(parsedTransaction))
    } else {
        res.status(501);
        throw new Error("Error getting transaction info");
    }
})

export const recordTransaction = expressAsyncHandler(async (req, res, next) => {
    const { txHash, networkId, abiType } = req.query;
})