import { Queue, Worker, Job, QueueEvents, RedisOptions } from 'bullmq';
export declare abstract class BaseQueue {
    protected queue: Queue;
    protected queueEvents: QueueEvents;
    protected connection: RedisOptions;
    private worker;
    constructor(queueName: string, connection: RedisOptions);
    abstract processJob(data: any): Promise<any>;
    abstract getQueueName(): string;
    abstract getQueue(): Queue;
    getWorker(): Worker;
    addJob(jobData: any): Promise<Job>;
    createWorker(concurrency?: number): Worker;
    getJobs(): Promise<Job[]>;
    getJobCounts(): Promise<{
        [index: string]: number;
    }>;
    getJobByName(jobName: string): Promise<Job>;
    getQueueEvents(): QueueEvents;
    clearQueue(): Promise<void>;
}
