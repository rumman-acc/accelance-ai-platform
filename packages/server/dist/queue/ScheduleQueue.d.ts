import { RedisOptions } from 'bullmq';
import { BaseQueue } from './BaseQueue';
import { ScheduleRecord } from '../database/entities/ScheduleRecord';
import { IComponentNodes } from '../Interface';
import { IScheduleAgentflowJobData } from '../Interface.Schedule';
import { DataSource } from 'typeorm';
import { Telemetry } from '../utils/telemetry';
import { CachePool } from '../CachePool';
import { UsageCacheManager } from '../UsageCacheManager';
import { IdentityManager } from '../IdentityManager';
interface ScheduleQueueOptions {
    appDataSource: DataSource;
    telemetry: Telemetry;
    cachePool: CachePool;
    componentNodes: IComponentNodes;
    usageCacheManager: UsageCacheManager;
    identityManager: IdentityManager;
}
export declare class ScheduleQueue extends BaseQueue {
    private componentNodes;
    private telemetry;
    private cachePool;
    private appDataSource;
    private usageCacheManager;
    private identityManager;
    private redisPublisher;
    private queueName;
    constructor(name: string, connection: RedisOptions, options: ScheduleQueueOptions);
    getQueueName(): string;
    getQueue(): import("bullmq").Queue<any, any, string, any, any, string>;
    processJob(data: IScheduleAgentflowJobData): Promise<any>;
    /**
     * Add a repeatable scheduled job using BullMQ's repeat options.
     * BullMQ deduplicates repeatable jobs by jobId pattern — safe to call on every startup.
     */
    upsertJobScheduler(record: ScheduleRecord): Promise<void>;
    /**
     * Remove a repeatable scheduled job from the queue.
     */
    removeJobScheduler(scheduleRecordId: string): Promise<void>;
}
export {};
