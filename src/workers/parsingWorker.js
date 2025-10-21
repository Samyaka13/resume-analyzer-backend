import { Worker } from "bullmq";
import { Resume } from "../models/resume.model.js"; // Operates on the Resume model
import dotenv from "dotenv";
import connectDB from "../db/index.js";
import axios from "axios";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

dotenv.config({
  path: "./.env",
});

console.log("Parsing worker is starting...");

connectDB()
  .then(() => {
    console.log("✅ Parsing worker connected to MongoDB.");
    // We'll start the worker only after the DB connection is successful
    startWorker();
  })
  .catch((err) => {
    console.log("❌ Parsing worker failed to connect to MongoDB!", err);
    process.exit(1);
  });

// This helper function is the core of this worker
async function extractTextFromUrl(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  const buffer = Buffer.from(response.data);

  if (url.endsWith(".pdf")) {
    const parser = new PDFParse({ url });
    const data = await parser.getText(buffer);
    await parser.destroy();
    return data.text;
  } else if (url.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  } else {
    throw new Error("Unsupported file type for parsing.");
  }
}

// The main processing function for each parsing job
const processor = async (job) => {
  const { resumeId } = job.data; // The job data contains a resumeId
  console.log(`Processing parsing job for resume ID: ${resumeId}`);

  try {
    // 1. Set status to 'parsing' to indicate work has started
    await Resume.findByIdAndUpdate(resumeId, { status: "parsing" });

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error(`Resume document with ID ${resumeId} not found.`);
    }

    // 2. Perform the heavy lifting: download and extract text
    const extractedText = await extractTextFromUrl(resume.storagePath);

    // 3. Update the resume with the extracted text and set status to 'parsed'
    await Resume.findByIdAndUpdate(resumeId, {
      status: "parsed",
      extractedText: extractedText,
    });

    console.log(`Parsing job completed for resume ID: ${resumeId}`);
  } catch (error) {
    console.error(`Parsing job failed for resume ID: ${resumeId}`, error);
    // If an error occurs, set the status to 'failed'
    await Resume.findByIdAndUpdate(resumeId, { status: "failed" });
    throw error; // This tells BullMQ the job failed and to handle retries
  }
};

// This function creates and starts the worker
function startWorker() {
  const redisConnection = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
  };

  console.log(
    "🚀 Parsing worker is now listening for jobs on the 'parsing-jobs' queue."
  );
  // The worker listens on a DIFFERENT queue name: 'parsing-jobs'
  new Worker("parsing-jobs", processor, { connection: redisConnection });
}
