import { ChatFlow } from '../database/entities/ChatFlow';
import { UsageCacheManager } from '../UsageCacheManager';
export declare const containsBase64File: (chatflow: ChatFlow) => boolean;
export declare const updateFlowDataWithFilePaths: (chatflowid: string, flowData: string, orgId: string, workspaceId: string, subscriptionId: string, usageCacheManager: UsageCacheManager) => Promise<string>;
