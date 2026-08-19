import { DataSource } from 'typeorm';
import { IComponentNodes, IExecuteFlowParams } from '../Interface';
import { Telemetry } from '../utils/telemetry';
import { CachePool } from '../CachePool';
import { AbortControllerPool } from '../AbortControllerPool';
import { BaseQueue } from './BaseQueue';
import { RedisOptions } from 'bullmq';
import { UsageCacheManager } from '../UsageCacheManager';
interface PredictionQueueOptions {
    appDataSource: DataSource;
    telemetry: Telemetry;
    cachePool: CachePool;
    componentNodes: IComponentNodes;
    abortControllerPool: AbortControllerPool;
    usageCacheManager: UsageCacheManager;
}
interface IGenerateAgentflowv2Params extends IExecuteFlowParams {
    prompt: string;
    componentNodes: IComponentNodes;
    toolNodes: IComponentNodes;
    selectedChatModel: Record<string, any>;
    question: string;
    isAgentFlowGenerator: boolean;
}
export declare class PredictionQueue extends BaseQueue {
    private componentNodes;
    private telemetry;
    private cachePool;
    private appDataSource;
    private abortControllerPool;
    private usageCacheManager;
    private redisPublisher;
    private queueName;
    constructor(name: string, connection: RedisOptions, options: PredictionQueueOptions);
    getQueueName(): string;
    getQueue(): import("bullmq").Queue<any, any, string, any, any, string>;
    processJob(data: IExecuteFlowParams | IGenerateAgentflowv2Params): Promise<any>;
}
export {};
