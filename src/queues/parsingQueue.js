import { Queue } from 'bullmq';

const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
};

export const parsingQueue = new Queue('parsing-jobs', { connection: redisConnection });

export const addParsingJob = async (jobData) => {
  await parsingQueue.add('process-resume-file', jobData);
  console.log(`Added parsing job for resume ID: ${jobData.resumeId}`);
};