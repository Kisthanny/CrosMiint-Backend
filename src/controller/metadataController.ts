import expressAsyncHandler from "express-async-handler";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import rfs from "recursive-fs"
import basePathConverter from "base-path-converter";
import Collection, { Protocol } from "../models/collectionModel";
import { getContract } from "../util/blockchainService";
import { Collection721 } from "../types";
import { ValidatedRequest } from "../middleware/authMiddleware";
import { IUser } from "../models/userModel";

export interface CreateGroupRes {
    id: string;
    user_id: string;
    name: string;
    updatedAt: string;
    createdAt: string;
}

const storage = multer.diskStorage({
    destination(req: ValidatedRequest, file, callback) {
        const uploadPath = `uploads/${req.user?._id}`;

        // 检查目录是否存在
        fs.access(uploadPath, fs.constants.F_OK, (err) => {
            if (!err) {
                // 如果目录存在，返回错误
                return callback(new Error('User already has an ongoing upload task.'), "");
            }

            // 如果目录不存在，创建目录
            fs.mkdir(uploadPath, { recursive: true }, (err) => {
                if (err) {
                    return callback(err, "");
                }
                callback(null, uploadPath);
            });
        });
    },
    filename(req, file, callback) {
        callback(null, Date.now() + path.extname(file.originalname));
    },
});

export const upload = multer({ storage });

const JWT = process.env.PINATA_API!;

const pinFileToIPFS = async (filePath: string, groupId: string) => {
    const formData = new FormData();
    const file = fs.createReadStream(filePath);

    formData.append('file', file);

    const pinataMetadata = JSON.stringify({
        name: path.basename(filePath),
    });
    formData.append('pinataMetadata', pinataMetadata);

    const pinataOptions = JSON.stringify({
        cidVersion: 0,
        groupId,
    })
    formData.append('pinataOptions', pinataOptions);

    try {
        const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${(formData as any)._boundary}`,
                'Authorization': `Bearer ${JWT}`,
            },
        });
        return res.data;
    } catch (error) {
        throw error;
    }
};

const pinJSONToIPFS = async (jsonString: string, groupId: string) => {
    try {
        const pinataContent = JSON.parse(jsonString);
        const reqBody = {
            pinataContent,
            pinataOptions: {
                cidVersion: 1,
                groupId,
            },
            pinataMetadata: {
                name: pinataContent.name,
            }
        }
        const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', reqBody, {
            headers: {
                'Content-Type': "application/json",
                'Authorization': `Bearer ${JWT}`,
            },
        });
        return res.data;
    } catch (error) {
        throw error;
    }
};

const pinDirectoryToPinata = async (src: string, groupId: string) => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    try {

        const { dirs, files } = await rfs.read(src);

        console.log({ files })

        const formData = new FormData();

        for (const file of files) {
            formData.append(`file`, fs.createReadStream(file), {
                filepath: basePathConverter(src, file),
            });
        }

        const pinataOptions = JSON.stringify({
            cidVersion: 0,
            groupId,
        })
        formData.append('pinataOptions', pinataOptions);
        console.log({ formData })

        const response = await axios.post(url, formData, {
            headers: {
                'Authorization': `Bearer ${JWT}`,
            },
        })

        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const getIPFSJSON = async (ipfsHash: string) => {
    try {
        const res = await axios.get(`${process.env.PINATA_GATEWAY!}${ipfsHash}`);
        return res.data;
    } catch (error) {
        return {
            isError: true,
            message: (error as Error).message
        }
    }
}

export const createGroup = async (address: string) => {
    const groupName = address.trim();
    const res = await axios.post('https://api.pinata.cloud/groups', {
        name: groupName,
    }, {
        headers: {
            'Content-Type': "application/json",
            'Authorization': `Bearer ${JWT}`,
        },
    });
    return res.data as CreateGroupRes;
}


export const uploadMedia = expressAsyncHandler(async (req: ValidatedRequest, res, next) => {
    const file = req.file;
    const { address } = req.body;

    if (!file) {
        res.status(400);
        return next(new Error('No file uploaded'));
    }

    const { path: filePath, originalname, mimetype } = file;

    try {
        const ext = path.extname(originalname);
        if (!address) {
            res.status(400);
            throw new Error('missing argument');
        }

        const collection = await Collection.findOne({
            address: (address as string).toLowerCase(),
            isBase: true
        }).populate("owner", "address");

        if (!collection) {
            res.status(400);
            throw new Error("Collection is not base or does not exist");
        }

        const ownerAddress = (collection.owner as IUser).address;
        if (ownerAddress.toLowerCase() !== req.user?.address.toLowerCase()) {
            res.status(403);
            throw new Error("Only owner can upload");
        }

        const ipfsGroupId = collection?.ipfsGroupId;
        if (!ipfsGroupId) {
            res.status(500);
            throw new Error("Missing IPFS groupId");
        }

        const pinataResponse = await pinFileToIPFS(filePath, ipfsGroupId);

        res.json({
            ipfsHash: pinataResponse.IpfsHash,
            ipfsUrl: `https://gateway.pinata.cloud/ipfs/${pinataResponse.IpfsHash}`,
            ipfsGroupId,
            mimetype,
            ext,
        });
    } catch (error) {
        return next(error);
    } finally {
        // 删除包含文件的目录
        const uploadDir = `uploads/${req.user?._id}`;
        fs.rmSync(uploadDir, { recursive: true, force: true });
    }
});

export const uploadJSON = expressAsyncHandler(async (req, res) => {
    const { ipfsHash, ipfsGroupId, name, ext, mimetype, description, traits = {} } = req.body;
    if (!ipfsHash || !ipfsGroupId || !name || !ext || !mimetype || !description) {
        res.status(400);
        throw new Error("missing argument");
    }

    const content = {
        name,
        description,
        ext,
        mimetype,
        mediaCID: ipfsHash,
        traits,
    }

    const data = await pinJSONToIPFS(JSON.stringify(content), ipfsGroupId);
    res.status(200).json(data)
})

export const uploadBatchMedia = expressAsyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[];
    const { address } = req.body;

    if (!files || files.length === 0) {
        res.status(400);
        throw new Error('No files uploaded');
    }

    if (!address) {
        res.status(400)
        throw new Error('missing argument');
    }

    const collection = await Collection.findOne({ address, isBase: true }).populate("deployedAt", "networkId");
    if (!collection) {
        res.status(400)
        throw new Error("Collection is not base or does not exist");
    }
    const ipfsGroupId = collection?.ipfsGroupId;
    if (!ipfsGroupId) {
        res.status(500)
        throw new Error("Missing IPFS groupId");
    }
    // only ERC-721 can upload batch
    const protocol = collection.protocol;
    if (protocol !== Protocol.ERC721) {
        res.status(400);
        throw new Error("Unsupported Protocol for batch upload");
    }

    const contract = getContract({
        protocol,
        address,
        networkId: collection.deployedAt.networkId,
    }) as Collection721;
    // files length should match minted count
    const [totalMinted, baseURI] = await Promise.all([contract.totalMinted(), contract.baseURI()]);
    if (files.length !== Number(totalMinted)) {
        res.status(400);
        throw new Error("upload file count should match minted count");
    }
    // baseURI should be empty string
    if (baseURI) {
        res.status(400);
        throw new Error("Collection already uploaded");
    }

    let directoryPath = ""
    try {
        directoryPath = `uploads/${(address as string).toLowerCase()}`;
        fs.mkdirSync(directoryPath);

        files.forEach((file, index) => {
            fs.renameSync(file.path, path.join(directoryPath, `${index}${path.extname(file.originalname)}`));
        });
        const result = await pinDirectoryToPinata(directoryPath, ipfsGroupId);
        res.status(200).json(result)

    } catch (error) {
        res.status(500).send((error as Error).toString());
    } finally {
        // 删除本地文件和目录
        fs.rmSync(directoryPath, { recursive: true });
    }
})

export const adminCreateGroup = expressAsyncHandler(async (req, res) => {
    const { address } = req.body;

    const data = await createGroup(address);

    res.status(200).json(data);
})
