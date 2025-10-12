import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["uploaded", "parsing", "parsed", "failed"], // Tracks the background job status
      default: "uploaded",
    },
    extractedText: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const Resume = mongoose.model("Resume", resumeSchema);
