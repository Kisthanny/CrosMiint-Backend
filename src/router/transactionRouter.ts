import { Router } from "express";
import { analyzeHash } from "../controller/transactionController";

const transactionRouter = Router();

transactionRouter.get("/analyzeHash", analyzeHash);

export default transactionRouter;