import expressAsyncHandler from "express-async-handler";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import rfs from "recursive-fs"
import csv from "csv-parser";
import { ValidatedRequest } from "../middleware/authMiddleware";

export interface CreateGroupRes {
    id: string;
    user_id: string;
    name: string;
    updatedAt: string;
    createdAt: string;
}

interface JsonMetadata {
    ipfsHash: string;
    mimetype: string;
    ext: string;
    name: string;
    description: string;
    traits: {
        [key: string]: string
    }
}

const storage = multer.diskStorage({
    destination(req: ValidatedRequest, file, callback) {
        callback(null, `uploads/${req.user?._id}`);
    },
    filename(req, file, callback) {
        callback(null, file.originalname);
    },
});

export const upload = multer({ storage });

const JWT = process.env.PINATA_API!;

const pinFileToIPFS = async (filePath: string) => {
    const formData = new FormData();
    const file = fs.createReadStream(filePath);

    formData.append('file', file);

    const pinataMetadata = JSON.stringify({
        name: path.basename(filePath),
    });
    formData.append('pinataMetadata', pinataMetadata);

    const pinataOptions = JSON.stringify({
        cidVersion: 0,
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

const pinJSONToIPFS = async (jsonString: string) => {
    try {
        const pinataContent = JSON.parse(jsonString);
        const reqBody = {
            pinataContent,
            pinataOptions: {
                cidVersion: 1,
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

const pinDirectoryToPinata = async (src: string) => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const { dirs, files } = await rfs.read(src);

    const formData = new FormData();

    for (const file of files) {
        formData.append(`file`, fs.createReadStream(file), {
            filepath: `jsonFiles/${path.basename(file)}`,
        });
    }

    const pinataOptions = JSON.stringify({
        cidVersion: 0,
    })
    formData.append('pinataOptions', pinataOptions);

    const response = await axios.post(url, formData, {
        headers: {
            'Authorization': `Bearer ${JWT}`,
        },
    })

    return response.data;
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

    if (!file) {
        res.status(400);
        return next(new Error('No file uploaded'));
    }

    const { path: filePath, originalname, mimetype } = file;

    try {
        const ext = path.extname(originalname);

        const pinataResponse = await pinFileToIPFS(filePath);

        res.json({
            ipfsHash: pinataResponse.IpfsHash,
            ipfsUrl: `https://gateway.pinata.cloud/ipfs/${pinataResponse.IpfsHash}`,
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
    const { ipfsHash, name, ext, mimetype, description, traits = {} } = req.body;
    if (!ipfsHash || !name || !ext || !mimetype || !description) {
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

    const data = await pinJSONToIPFS(JSON.stringify(content));
    res.status(200).json(data)
})

export const uploadBatchMedia = expressAsyncHandler(async (req: ValidatedRequest, res, next) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        res.status(400);
        return next(new Error('No files uploaded'));
    }

    const directoryPath = `uploads/${req.user?._id}`
    const imageHashes: { [key: string]: string; } = {};
    try {
        for (const file of files) {
            const data = await pinFileToIPFS(file.path);
            imageHashes[file.originalname] = data.IpfsHash;
        }

        res.status(200).json({ message: 'Images uploaded successfully', imageHashes });

    } catch (error) {
        return next(error);
    } finally {
        // 删除本地文件和目录
        fs.rmSync(directoryPath, { recursive: true, force: true });
    }
})

export const uploadCSV = expressAsyncHandler(async (req: ValidatedRequest, res, next) => {
    const { imageHashes } = req.body;
    const file = req.file;

    if (!file) {
        res.status(400);
        return next(new Error('No file uploaded'));
    }
    const uploadDir = `uploads/${req.user?._id}`;
    try {
        const results: any[] = await new Promise((resolve, reject) => {
            const resultData: any[] = [];

            fs.createReadStream(file.path)
                .pipe(csv())
                .on('data', (data) => resultData.push(data))
                .on('end', () => resolve(resultData))
                .on('error', (err) => reject(err));
        });

        const jsonFiles: { [key: string]: JsonMetadata } = {};
        const parsedImageHashes = JSON.parse(imageHashes as string);

        results.forEach(row => {
            const tokenId = row.tokenID;
            const fileName = row.file_name;
            const ipfsHash = parsedImageHashes[fileName]
            if (!ipfsHash) {
                throw new Error(`FileName ${fileName} Not Found`);
            }

            const traits: { [key: string]: string } = {};

            for (const key in row) {
                if (key.startsWith('attributes[') && key.endsWith(']')) {
                    const traitType = key.slice(11, -1);
                    traits[traitType] = row[key];
                }
            }

            const jsonData: JsonMetadata = {
                ipfsHash: parsedImageHashes[fileName],
                mimetype: file.mimetype,
                ext: path.extname(fileName),
                name: row.name,
                description: row.description,
                traits
            };

            jsonFiles[tokenId] = jsonData;
        });

        const jsonDir = path.join(uploadDir, "/jsonFiles");
        if (!fs.existsSync(jsonDir)) {
            fs.mkdirSync(jsonDir, { recursive: true });
        }

        for (const [tokenId, jsonData] of Object.entries(jsonFiles)) {
            fs.writeFileSync(path.join(jsonDir, `${tokenId}.json`), JSON.stringify(jsonData, null, 2));
        }

        // 将文件夹上传到IPFS
        const result = await pinDirectoryToPinata(jsonDir);
        res.status(200).json({ message: 'CSV processed successfully', folderIpfsHash: result.IpfsHash });
    } catch (error) {
        return next(error);
    } finally {
        // 删除包含文件的目录
        fs.rmSync(uploadDir, { recursive: true, force: true });
    }
});

export const adminCreateGroup = expressAsyncHandler(async (req, res) => {
    const { address } = req.body;

    const data = await createGroup(address);

    res.status(200).json(data);
})
