import { Resume } from "../models/resume.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"; // Assuming you have an async wrapper
import {
  deleteFromCloudinaryByUrl,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const uploadResume = asyncHandler(async (req, res) => {
  if (!req.files) {
    return res.status(400).json({ message: "Resume file is required." });
  }

  let resumeLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.resumeFile) &&
    req.files.resumeFile.length > 0
  ) {
    resumeLocalPath = req.files.resumeFile[0].path;
  }
  if (!resumeLocalPath) {
    throw new ApiError(400, "Resume is required");
  }
  const cloudinaryResumeResponse = await uploadOnCloudinary(resumeLocalPath);
  if (!cloudinaryResumeResponse) {
    throw new ApiError(400, "Resume is required");
  }
  const newResume = await Resume.create({
    user: req.user._id,
    originalFilename: req.files.resumeFile[0].originalname,
    storagePath: cloudinaryResumeResponse.url,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newResume, "Resume Uploaded Successfully"));
});

const getAllUserResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  if (!resumes || resumes.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No Resumes to show"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, resumes, "Resumes Retrived Successfully"));
});

const deleteResume = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });

  if (!resume) {
    throw new ApiError(
      400,
      "Resume not found or you don't have permission to delete it"
    );
  }

  deleteFromCloudinaryByUrl(resume.storagePath);
  await Resume.findByIdAndDelete(resumeId);
  return res
    .status(200)
    .json(new ApiResponse(200, "Resume Deleted successfully"));
});

const getResumeById = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;

  const resume = await Resume.findOne({
    _id: resumeId,
    user: req.user._id, // TODO: Ensure the user owns this resume
  });

  if (!resume) {
    throw new ApiError(
      400,
      "Resume not found or you don't have permission to access it"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, resume,"Resume fetched successfully"));
});
export { uploadResume, getAllUserResumes, deleteResume, getResumeById };
