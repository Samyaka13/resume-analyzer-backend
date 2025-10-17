import { Analysis } from "../models/analysis.model.js";
import { Resume } from "../models/resume.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
// TODO: When you build your job queue, you will import its 'add' function here.
// import { addAnalysisJob } from "../jobs/analysis.job.js";

const createAnalysis = asyncHandler(async (req, res) => {
  // 1. Get data from the request body
  const { resumeId, jobDescriptionText } = req.body;

  // 2. Validate the input
  if (!resumeId || !jobDescriptionText) {
    throw new ApiError(400, "Resume ID and Job Description are required.");
  }

  // 3. Verify that the resume exists and belongs to the logged-in user (Security Check)
  const resume = await Resume.findOne({
    _id: resumeId,
    user: req.user._id,
  });

  if (!resume) {
    throw new ApiError(
      404,
      "Resume not found or you do not have permission to use it."
    );
  }

  // Extra check: Do not allow analysis if resume parsing failed or is still pending
  if (resume.status !== "parsed") {
    throw new ApiError(
      400,
      `This resume is not ready for analysis. Current status: ${resume.status}`
    );
  }

  // 4. Create the new analysis record in the database
  const newAnalysis = await Analysis.create({
    user: req.user._id,
    resume: resumeId,
    jobDescriptionText: jobDescriptionText,
    // The 'status' will default to 'queued' as per the model schema
  });

  // 5. Enqueue the background job for processing
  // TODO: This is where you will add the job to your queue (e.g., BullMQ)
  // await addAnalysisJob({ analysisId: newAnalysis._id });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        newAnalysis,
        "Analysis request received and is being processed."
      )
    );
});

const getAnalysisHistory = asyncHandler(async (req, res) => {
  // Find all analyses belonging to the logged-in user, sorted by newest first
  const analyses = await Analysis.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  if (!analyses || analyses.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No analysis history found."));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, analyses, "Analysis history retrieved successfully.")
    );
});

const getAnalysisById = asyncHandler(async (req, res) => {
  const { analysisId } = req.params;

  // Find the analysis by its ID, ensuring it belongs to the logged-in user
  const analysis = await Analysis.findOne({
    _id: analysisId,
    user: req.user._id,
  });

  if (!analysis) {
    throw new ApiError(
      404,
      "Analysis not found or you do not have permission to view it."
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, analysis, "Analysis details fetched successfully.")
    );
});

const deleteAnalysis = asyncHandler(async (req, res) => {
  const { analysisId } = req.params;

  // Find and delete the analysis record in one step, ensuring ownership
  const deletedAnalysis = await Analysis.findOneAndDelete({
    _id: analysisId,
    user: req.user._id,
  });

  if (!deletedAnalysis) {
    throw new ApiError(
      404,
      "Analysis not found or you do not have permission to delete it."
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Analysis deleted successfully."));
});

export { createAnalysis, getAnalysisHistory, getAnalysisById, deleteAnalysis };
