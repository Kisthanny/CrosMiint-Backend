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

    res.status(200).json({
        heroImage: homePage.heroImage,
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