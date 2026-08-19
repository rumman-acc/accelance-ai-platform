import { Request } from 'express';
import { IExecuteFlowParams } from '../Interface';
export declare const executeUpsert: ({ componentNodes, incomingInput, chatflow, chatId, appDataSource, telemetry, cachePool, isInternal, files, orgId, workspaceId, subscriptionId, usageCacheManager }: IExecuteFlowParams) => Promise<any>;
/**
 * Upsert documents
 * @param {Request} req
 * @param {boolean} isInternal
 */
export declare const upsertVector: (req: Request, isInternal?: boolean) => Promise<any>;
