import expressAsyncHandler from "express-async-handler";
import Airdrop, { IAirdrop } from "../models/airdropModel";
import HomePage from "../models/homePageModel";
import { formatDocument, formatLikes } from "../util/responseFormatter";
import { ValidatedRequest } from "../middleware/authMiddleware";
import { populate } from "dotenv";

export const createHomePage = expressAsyncHandler(async (req, res, next) => {
    const { ipfsHash } = req.body;

    const homePage = await HomePage.create({
        heroImage: `${process.env.PINATA_GATEWAY!}${ipfsHash}`,
    })

    res.status(200).json(formatDocument(homePage));
})

export const getHomePage = expressAsyncHandler(async (req: ValidatedRequest, res, next) => {
    const homePage = await HomePage.findOne({})
    if (!homePage) {
        res.status(500);
        throw new Error("No HomePage Info")
    }
    const top5AirdropList = await Airdrop.find({
        endTime: { $gt: new Date() }  // endTime 属性时间大于当前时间
    })
        .sort({ likes: -1 })  // 按 likes 数组长度降序排列
        .limit(5)
        .populate({
            path: 'fromCollection',
            select: 'owner name logoURI category previewImage',
            populate: {
                path: 'owner',
                select: 'name avatar'
            }
        })
        .exec();

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