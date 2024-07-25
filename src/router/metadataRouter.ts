import { Router } from "express";
import { adminCreateGroup, upload, uploadBatchMedia, uploadJSON, uploadMedia } from "../controller/metadataController";
import { adminOnly, protect } from "../middleware/authMiddleware";

const metadataRouter = Router();

metadataRouter.post("/uploadMedia", protect, upload.single("file"), uploadMedia);

metadataRouter.post("/uploadBatchMedia", protect, upload.array("files"), uploadBatchMedia);

metadataRouter.post("/uploadJSON", protect, uploadJSON);

metadataRouter.post('/adminCreateGroup', protect, adminOnly, adminCreateGroup);

export default metadataRouter;