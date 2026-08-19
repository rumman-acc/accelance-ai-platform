import { BaseCommand } from './base';
import { Telemetry } from '../utils/telemetry';
import { CachePool } from '../CachePool';
import { AbortControllerPool } from '../AbortControllerPool';
import { UsageCacheManager } from '../UsageCacheManager';
import { IdentityManager } from '../IdentityManager';
export default class Worker extends BaseCommand {
    predictionWorkerId: string;
    upsertionWorkerId: string;
    scheduleWorkerId: string;
    run(): Promise<void>;
    prepareData(): Promise<{
        appDataSource: import("typeorm").DataSource;
        telemetry: Telemetry;
        componentNodes: import("../Interface").IComponentNodes;
        cachePool: CachePool;
        abortControllerPool: AbortControllerPool;
        usageCacheManager: UsageCacheManager;
        identityManager: IdentityManager;
    }>;
    catch(error: Error): Promise<void>;
    stopProcess(): Promise<void>;
}
