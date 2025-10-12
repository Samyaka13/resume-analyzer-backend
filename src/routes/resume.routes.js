import { Router } from "express";
import {
  deleteResume,
  getAllUserResumes,
  getResumeById,
  uploadResume,
} from "../controllers/resume.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);
router
  .route("/")
  .get(getAllUserResumes)
  .post(upload.fields([{ name: "resumeFile", maxCount: 1 }]), uploadResume);
router.route("/:resumeId").delete(deleteResume).get(getResumeById);
export default router;
