import { Worker } from "bullmq";
import { Analysis } from "../models/analysis.model.js";
import { Resume } from "../models/resume.model.js";
import dotenv from "dotenv";
import connectDB from "../db/index.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
dotenv.config({
  path: "./.env",
});
console.log("Worker is starting...");

connectDB()
  .then(() => {
    console.log("✅ Worker connected to MongoDB.");
    startWorker();
  })
  .catch((err) => {
    console.log("❌ Worker failed to connect to MongoDB!", err);
    process.exit(1); 
  });

const redisConnection = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
};

// The main function that will be executed for every job
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

const processor = async (job) => {
  const { analysisId } = job.data;
  console.log(`Processing job for analysis ID: ${analysisId}`);

  try {
    await Analysis.findByIdAndUpdate(analysisId, { status: "processing" });

    // --- HEAVY LIFTING STARTS HERE ---

    const analysisDoc = await Analysis.findById(analysisId).populate("resume");
    if (!analysisDoc) {
      throw new Error(`Analysis document with ID ${analysisId} not found.`);
    }

    const resumeText = analysisDoc.resume.extractedText;
    const jobDescription = analysisDoc.jobDescriptionText;

    // --- 3. Construct the prompt for Gemini ---
    const prompt = `
            You are an expert AI resume analyzer. Compare the user's resume with the job description.
            Your response must be ONLY a valid JSON object with the following keys:
            - "fitScore": a number between 0 and 100
            - "matchedKeywords": an array of strings
            - "missingKeywords": an array of strings
            - "skillGapAnalysis": a concise, one-paragraph summary of actionable advice.

            Here is the resume text:
            ---
            ${resumeText}
            ---

            And here is the job description:
            ---
            ${jobDescription}
            ---
        `;

    // --- 4. Call the Gemini API ---
    console.log("Sending data to Google Gemini for analysis...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response.text();

    // Clean the response to ensure it's valid JSON
    const cleanedJsonString = jsonString
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const analysisResult = JSON.parse(cleanedJsonString);

    // --- HEAVY LIFTING ENDS HERE ---

    await Analysis.findByIdAndUpdate(analysisId, {
      status: "completed",
      result: analysisResult,
    });

    console.log(`Job completed for analysis ID: ${analysisId}`);
  } catch (error) {
    console.error(`Job failed for analysis ID: ${analysisId}`, error);
    await Analysis.findByIdAndUpdate(analysisId, { status: "failed" });
    throw error;
  }
};

// Create the worker
function startWorker() {
  const redisConnection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  };

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

  console.log("🚀 Analysis worker is now listening for jobs on the 'analysis-jobs' queue.");
  new Worker("analysis-jobs", processor, { connection: redisConnection });
}
