import { Router } from "express";
import { adminCreateGroup, upload, uploadBatchMedia, uploadCSV, uploadJSON, uploadMedia } from "../controller/metadataController";
import { adminOnly, protect } from "../middleware/authMiddleware";
import { uploadPathMiddleware } from "../middleware/uploadPathMiddleware ";

const metadataRouter = Router();

metadataRouter.post("/uploadMedia", protect, uploadPathMiddleware, upload.single("file"), uploadMedia);

metadataRouter.post("/uploadBatchMedia", protect, uploadPathMiddleware, upload.array("files"), uploadBatchMedia);

metadataRouter.post("/uploadJSON", protect, uploadJSON);

metadataRouter.post("/uploadCSV", protect, uploadPathMiddleware, upload.single("csv"), uploadCSV);

metadataRouter.post('/adminCreateGroup', protect, adminOnly, adminCreateGroup);

export default metadataRouter;