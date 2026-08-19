import { Request } from 'express';
import { ICommonObject, IServerSideEventStreamer } from 'accelance-components';
import { ChatType, IExecuteFlowParams } from '../Interface';
declare const shouldAutoPlayTTS: (textToSpeechConfig: string | undefined | null) => boolean;
declare const generateTTSForResponseStream: (responseText: string, textToSpeechConfig: string | undefined, options: ICommonObject, chatId: string, chatMessageId: string, sseStreamer: IServerSideEventStreamer, abortController?: AbortController) => Promise<void>;
export declare const executeFlow: ({ componentNodes, incomingInput, chatflow, chatId, isEvaluation, evaluationRunId, appDataSource, telemetry, cachePool, usageCacheManager, sseStreamer, baseURL, isInternal, files, signal, isTool, chatType, orgId, workspaceId, subscriptionId, productId, userId }: IExecuteFlowParams) => Promise<any>;
/**
 * Build/Data Preparation for execute function
 * @param {Request} req
 * @param {boolean} isInternal
 */
export declare const utilBuildChatflow: (req: Request, isInternal?: boolean, chatType?: ChatType) => Promise<any>;
export { shouldAutoPlayTTS, generateTTSForResponseStream };
