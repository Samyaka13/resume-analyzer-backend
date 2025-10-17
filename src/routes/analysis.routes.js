import { Router } from "express";
import {
  createAnalysis,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
} from "../controllers/analysis.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createAnalysis).get(getAnalysisHistory);
router.route("/:analysisId").get(getAnalysisById).delete(deleteAnalysis);

export default router;
