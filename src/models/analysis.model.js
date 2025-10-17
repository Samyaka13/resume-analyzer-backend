import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    jobDescriptionText: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
    },
    result: {
      fitScore: {
        type: Number,
      },
      matchedKeywords: {
        type: [String],
      },
      missingKeywords: {
        type: [String],
      },
      skillGapAnalysis: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

export const Analysis = mongoose.model("Analysis", analysisSchema);
