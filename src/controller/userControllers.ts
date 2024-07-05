import expressAsyncHandler from "express-async-handler";
import User from "../models/userModel";
import { ValidatedRequest } from "../middleware/authMiddleware";
import { generateToken } from "../config/generateToken";
import { ethers } from "ethers";

const findOrCreateUser = async (rawAddress: string) => {
    const address = rawAddress.toLocaleLowerCase();
    if (!ethers.isAddress(address)) {
        throw new Error("User address Invalid");
    }

    let user = await User.findOne({ address });
    if (user) {
        return user;
    }

    user = await User.create({
        address,
    });
    if (!user) {
        throw new Error("Failed to Add the User");
    }

    return user;
}

export const getDemoSignMessage = expressAsyncHandler(async (req, res) => {
    const privateKey = process.env.PRIVATE_DEMO!;
    const wallet = new ethers.Wallet(privateKey);

    const message = process.env.SIGN_MESSAGE!;

    const signature = await wallet.signMessage(message);

    const publicAddress = wallet.address;

    res.status(200).json({ signature, publicAddress })
})

export const authUser = expressAsyncHandler(async (req: ValidatedRequest, res) => {
    const { address, signature } = req.body;

    if (!address || !signature) {
        res.status(400);
        throw new Error("missing argument");
    }

    if (!req.signatureVerified) {
        res.status(400);
        throw new Error("Invalid Signature");
    }

    const user = await findOrCreateUser(address);

    res.status(201).json({
        _id: user._id,
        address: user.address,
        token: generateToken(String(user._id)),
    });
});

export const updateUser = expressAsyncHandler(async (req: ValidatedRequest, res) => {
    const { address, name, avatar, bio, email, facebook, twitter, instagram } = req.body;

    if (!address) {
        res.status(400);
        throw new Error("missing argument");
    }

    // const user = await findOrCreateUser(address);
    const user = req.user;
    if (!user) {
        res.status(400);
        throw new Error('Unauthorized');
    }

    user.name = name || user.name;
    user.avatar = avatar || user.avatar;
    user.bio = bio || user.bio;
    user.email = email || user.email;
    user.facebook = facebook || user.facebook;
    user.twitter = twitter || user.twitter;
    user.instagram = instagram || user.instagram;

    const updatedUser = await user.save();

    res.status(200).json(updatedUser.toObject({
        versionKey: false,  // 去掉 __v 字段
        transform: function (doc, ret) {
            delete ret._id; // 如果不需要 _id 字段，可以删除
            return ret;
        }
    }));
});