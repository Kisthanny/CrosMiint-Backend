import expressAsyncHandler from "express-async-handler";
import User, { Role } from "../models/userModel";
import { ValidatedRequest } from "../middleware/authMiddleware";
import { generateToken } from "../config/generateToken";
import { ethers } from "ethers";
import { formatDocument } from "../util/responseFormatter";

export const findOrCreateUser = async (rawAddress: string) => {
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
    const { privateKey } = req.params;
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
        ...formatDocument(user),
        token: generateToken(String(user._id)),
    });
});

export const updateUser = expressAsyncHandler(async (req: ValidatedRequest, res) => {
    const { name, bio, email, facebook, twitter, instagram } = req.body;

    const user = req.user;
    if (!user) {
        res.status(400);
        throw new Error('Unauthorized');
    }

    user.name = name || user.name;
    user.bio = bio || user.bio;
    user.email = email || user.email;
    user.facebook = facebook || user.facebook;
    user.twitter = twitter || user.twitter;
    user.instagram = instagram || user.instagram;

    const updatedUser = await user.save();

    res.status(200).json(formatDocument(updatedUser));
});

export const updateUserAccess = expressAsyncHandler(async (req, res) => {
    const { address, role } = req.body;

    if (!address || !role) {
        res.status(400);
        throw new Error("missing argument");
    }
    if (!Object.values(Role).includes(role)) {
        res.status(400);
        throw new Error(`no such role: ${role}`);
    }

    const user = await findOrCreateUser(address);
    user.role = role;
    const updatedUser = await user.save();

    res.status(200).json({
        address: updatedUser.address,
        role: updatedUser.role,
    });
})

export const updateProfileCover = expressAsyncHandler(async (req: ValidatedRequest, res) => {
    const { ipfsHash } = req.body;
    const user = req.user;
    if (!user) {
        res.status(401);
        throw new Error("Please Connect Your Wallet First")
    };

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
        res.status(404);
        throw new Error("User Not Found");
    }

    userDoc.profileCover = `${process.env.PINATA_GATEWAY!}${ipfsHash}`;
    await userDoc.save();

    res.status(200).json(formatDocument(userDoc));
})

export const getUserInfo = expressAsyncHandler(async (req, res) => {
    const { id } = req.query;

    const userDoc = await User.findById(id);

    if (!userDoc) {
        res.status(404);
        throw new Error("User Not Found");
    }

    res.status(200).json(formatDocument(userDoc));
})

export const updateProfileAvatar = expressAsyncHandler(async (req:ValidatedRequest, res) => {
    const { ipfsHash } = req.body;
    const user = req.user;
    if (!user) {
        res.status(401);
        throw new Error("Please Connect Your Wallet First")
    };

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
        res.status(404);
        throw new Error("User Not Found");
    }

    userDoc.avatar = `${process.env.PINATA_GATEWAY!}${ipfsHash}`;
    await userDoc.save();

    res.status(200).json(formatDocument(userDoc));
})