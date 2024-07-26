import expressAsyncHandler from "express-async-handler";
import Airdrop, { IAirdrop } from "../models/airdropModel";
import HomePage from "../models/homePageModel";
import { formatDocument, formatLikes } from "../util/responseFormatter";
import { ValidatedRequest } from "../middleware/authMiddleware";
import { populate } from "dotenv";

export const createHomePage = expressAsyncHandler(async (req, res, next) => {
    const { ipfsHash } = req.body;
    const top5AirdropList = await Airdrop.aggregate([
        {
            $addFields: {
                likeCount: { $size: "$likes" }  // 添加一个虚拟字段 likeCount 表示 likes 数组的长度
            }
        },
        {
            $sort: { likeCount: -1 }  // 根据 likeCount 降序排序
        },
        {
            $limit: 5
        }
    ]).exec();
    const homePage = await HomePage.create({
        heroImage: `${process.env.PINATA_GATEWAY!}${ipfsHash}`,
        top5AirdropList,
    })

    res.status(200).json(formatDocument(homePage));
})

export const getHomePage = expressAsyncHandler(async (req: ValidatedRequest, res, next) => {
    const homePage = await HomePage.findOne({}).populate({
        path: "top5AirdropList",
        populate: [
            {
                path: "fromCollection",
                select: "owner name logoURI category previewImage",
                populate: [
                    {
                        path: "owner",
                        select: "name avatar"
                    }
                ]
            },
        ]
    });
    if (!homePage) {
        res.status(500);
        throw new Error("No HomePage Info")
    }
    const top5AirdropList = homePage.top5AirdropList as IAirdrop[];
    res.status(200).json({
        heroImage: homePage.heroImage,
        top5AirdropList: formatLikes(formatDocument(top5AirdropList), req.user),
    });
})

export const updateHomePage = expressAsyncHandler(async (req, res, next) => {
    const { ipfsHash } = req.body;
    const homePage = await HomePage.findOne({});
    if (!homePage) {
        res.status(500);
        throw new Error("No HomePage Info")
    }
    homePage.heroImage = `${process.env.PINATA_GATEWAY!}${ipfsHash}`;
    await homePage.save();
    res.status(200).json(formatDocument(homePage));
})