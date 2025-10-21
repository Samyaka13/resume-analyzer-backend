import { Queue } from "bullmq";

// This is the connection to the Redis container you started with Docker.
// '127.0.0.1' is the same as 'localhost'.
const redisConnection = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
};

// Create a new Queue. The name 'analysis-jobs' is important,
// as the worker will listen for jobs on this same named queue.
export const analysisQueue = new Queue("analysis-jobs", {
  connection: redisConnection,
});

// A reusable function to add a new analysis job.
// Our controller will call this function.
export const addAnalysisJob = async (jobData) => {
  await analysisQueue.add("process-analysis", jobData);
  console.log(`Added a new job for analysis ID: ${jobData.analysisId}`);
};

