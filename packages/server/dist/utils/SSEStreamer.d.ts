import { Response } from 'express';
import { IServerSideEventStreamer } from 'accelance-components';
export declare class SSEStreamer implements IServerSideEventStreamer {
    private readonly clients;
    private readonly observers;
    private heartbeatInterval;
    hasClient(chatId: string): boolean;
    /**
     * True when there's either a real client or at least one active observer for this chatId.
     */
    hasClientOrObserver(chatId: string): boolean;
    addObserver(sourceChatId: string, observerId: string): void;
    removeObserver(sourceChatId: string, observerId: string): void;
    clearObservers(sourceChatId: string): void;
    addExternalClient(chatId: string, res: Response): void;
    addClient(chatId: string, res: Response): void;
    /**
     * Safely write data to a client's response. If the write fails (e.g., client already disconnected),
     * the client is automatically removed to prevent further writes to a dead connection.
     * Also fans out to any registered observers of `chatId`.
     */
    private safeWrite;
    removeClient(chatId: string): void;
    streamCustomEvent(chatId: string, eventType: string, data: any): void;
    streamStartEvent(chatId: string, data: string): void;
    streamTokenEvent(chatId: string, data: string): void;
    streamThinkingEvent(chatId: string, data: string, duration?: number): void;
    streamSourceDocumentsEvent(chatId: string, data: any): void;
    streamArtifactsEvent(chatId: string, data: any): void;
    streamUsedToolsEvent(chatId: string, data: any): void;
    streamCalledToolsEvent(chatId: string, data: any): void;
    streamFileAnnotationsEvent(chatId: string, data: any): void;
    streamToolEvent(chatId: string, data: any): void;
    streamAgentReasoningEvent(chatId: string, data: any): void;
    streamNextAgentEvent(chatId: string, data: any): void;
    streamAgentFlowEvent(chatId: string, data: any): void;
    streamAgentFlowExecutedDataEvent(chatId: string, data: any): void;
    streamNextAgentFlowEvent(chatId: string, data: any): void;
    streamActionEvent(chatId: string, data: any): void;
    streamAbortEvent(chatId: string): void;
    streamEndEvent(_: string): void;
    streamErrorEvent(chatId: string, msg: string): void;
    streamMetadataEvent(chatId: string, apiResponse: any): void;
    streamUsageMetadataEvent(chatId: string, data: any): void;
    streamTTSStartEvent(chatId: string, chatMessageId: string, format: string): void;
    streamTTSDataEvent(chatId: string, chatMessageId: string, audioChunk: string): void;
    streamTTSEndEvent(chatId: string, chatMessageId: string): void;
    streamTTSAbortEvent(chatId: string, chatMessageId: string): void;
    startHeartbeat(intervalMs?: number): void;
    stopHeartbeat(): void;
}
