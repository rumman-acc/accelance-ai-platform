import express from 'express';
import 'global-agent/bootstrap';
import { DataSource } from 'typeorm';
import { AbortControllerPool } from './AbortControllerPool';
import { CachePool } from './CachePool';
import { LoggedInUser } from './enterprise/Interface.Enterprise';
import { IdentityManager } from './IdentityManager';
import { IMetricsProvider } from './Interface.Metrics';
import { NodesPool } from './NodesPool';
import { QueueManager } from './queue/QueueManager';
import { RedisEventSubscriber } from './queue/RedisEventSubscriber';
import { UsageCacheManager } from './UsageCacheManager';
import { RateLimiterManager } from './utils/rateLimit';
import { SSEStreamer } from './utils/SSEStreamer';
import { Telemetry } from './utils/telemetry';
declare global {
    namespace Express {
        interface User extends LoggedInUser {
        }
        interface Request {
            user?: LoggedInUser;
        }
        namespace Multer {
            interface File {
                bucket: string;
                key: string;
                acl: string;
                contentType: string;
                contentDisposition: null;
                storageClass: string;
                serverSideEncryption: null;
                metadata: any;
                location: string;
                etag: string;
            }
        }
    }
}
export declare class App {
    app: express.Application;
    nodesPool: NodesPool;
    abortControllerPool: AbortControllerPool;
    cachePool: CachePool;
    telemetry: Telemetry;
    rateLimiterManager: RateLimiterManager;
    AppDataSource: DataSource;
    sseStreamer: SSEStreamer;
    identityManager: IdentityManager;
    metricsProvider: IMetricsProvider;
    queueManager: QueueManager;
    redisSubscriber: RedisEventSubscriber;
    usageCacheManager: UsageCacheManager;
    sessionStore: any;
    constructor();
    initDatabase(): Promise<void>;
    config(): Promise<void>;
    stopApp(): Promise<void>;
}
export declare function start(): Promise<void>;
export declare function getInstance(): App | undefined;
