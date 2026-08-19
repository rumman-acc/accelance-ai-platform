"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseQueue = void 0;
const bullmq_1 = require("bullmq");
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../utils/logger"));
const QUEUE_REDIS_EVENT_STREAM_MAX_LEN = process.env.QUEUE_REDIS_EVENT_STREAM_MAX_LEN
    ? parseInt(process.env.QUEUE_REDIS_EVENT_STREAM_MAX_LEN)
    : 10000;
const WORKER_CONCURRENCY = process.env.WORKER_CONCURRENCY ? parseInt(process.env.WORKER_CONCURRENCY) : 100000;
const REMOVE_ON_AGE = process.env.REMOVE_ON_AGE ? parseInt(process.env.REMOVE_ON_AGE) : -1;
const REMOVE_ON_COUNT = process.env.REMOVE_ON_COUNT ? parseInt(process.env.REMOVE_ON_COUNT) : -1;
class BaseQueue {
    constructor(queueName, connection) {
        this.connection = connection;
        this.queue = new bullmq_1.Queue(queueName, {
            connection: this.connection,
            streams: { events: { maxLen: QUEUE_REDIS_EVENT_STREAM_MAX_LEN } }
        });
        this.queueEvents = new bullmq_1.QueueEvents(queueName, { connection: this.connection });
    }
    getWorker() {
        return this.worker;
    }
    async addJob(jobData) {
        const jobId = jobData.id || (0, uuid_1.v4)();
        let removeOnFail = true;
        let removeOnComplete = undefined;
        // Only override removal options if age or count is specified
        if (REMOVE_ON_AGE !== -1 || REMOVE_ON_COUNT !== -1) {
            const keepJobObj = {};
            if (REMOVE_ON_AGE !== -1) {
                keepJobObj.age = REMOVE_ON_AGE;
            }
            if (REMOVE_ON_COUNT !== -1) {
                keepJobObj.count = REMOVE_ON_COUNT;
            }
            removeOnFail = keepJobObj;
            removeOnComplete = keepJobObj;
        }
        return await this.queue.add(jobId, jobData, { removeOnFail, removeOnComplete });
    }
    createWorker(concurrency = WORKER_CONCURRENCY) {
        try {
            this.worker = new bullmq_1.Worker(this.queue.name, async (job) => {
                const start = new Date().getTime();
                logger_1.default.info(`[BaseQueue] Processing job ${job.id} in ${this.queue.name} at ${new Date().toISOString()}`);
                try {
                    const result = await this.processJob(job.data);
                    const end = new Date().getTime();
                    logger_1.default.info(`[BaseQueue] Completed job ${job.id} in ${this.queue.name} at ${new Date().toISOString()} (${end - start}ms)`);
                    return result;
                }
                catch (error) {
                    const end = new Date().getTime();
                    logger_1.default.error(`[BaseQueue] Job ${job.id} failed in ${this.queue.name} at ${new Date().toISOString()} (${end - start}ms):`, { error });
                    throw error;
                }
            }, {
                connection: this.connection,
                concurrency
            });
            // Add error listeners to the worker
            this.worker.on('error', (err) => {
                logger_1.default.error(`[BaseQueue] Worker error for queue "${this.queue.name}":`, { error: err });
            });
            this.worker.on('closed', () => {
                logger_1.default.info(`[BaseQueue] Worker closed for queue "${this.queue.name}"`);
            });
            this.worker.on('failed', (job, err) => {
                logger_1.default.error(`[BaseQueue] Worker job ${job?.id} failed in queue "${this.queue.name}":`, { error: err });
            });
            logger_1.default.info(`[BaseQueue] Worker created successfully for queue "${this.queue.name}"`);
            return this.worker;
        }
        catch (error) {
            logger_1.default.error(`[BaseQueue] Failed to create worker for queue "${this.queue.name}":`, { error });
            throw error;
        }
    }
    async getJobs() {
        return await this.queue.getJobs();
    }
    async getJobCounts() {
        return await this.queue.getJobCounts();
    }
    async getJobByName(jobName) {
        const jobs = await this.queue.getJobs();
        const job = jobs.find((job) => job.name === jobName);
        if (!job)
            throw new Error(`Job name ${jobName} not found`);
        return job;
    }
    getQueueEvents() {
        return this.queueEvents;
    }
    async clearQueue() {
        await this.queue.obliterate({ force: true });
    }
}
exports.BaseQueue = BaseQueue;
//# sourceMappingURL=BaseQueue.js.map