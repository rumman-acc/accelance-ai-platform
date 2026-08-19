import { Logger } from 'winston'
import { Tracer } from '@opentelemetry/sdk-trace-base'
import { BaseCallbackHandler, NewTokenIndices, HandleLLMNewTokenCallbackFields } from '@langchain/core/callbacks/base'
import { BaseTracer, Run } from '@langchain/core/tracers/base'
import { ChainValues } from '@langchain/core/utils/types'
import { AgentAction } from '@langchain/core/agents'
import { ICommonObject, INodeData, IServerSideEventStreamer } from './Interface'
import { BaseMessageLike } from '@langchain/core/messages'
import { Serialized } from '@langchain/core/load/serializable'
export interface AgentRun extends Run {
    actions: AgentAction[]
}
interface PhoenixTracerOptions {
    apiKey: string
    baseUrl: string
    projectName: string
    sdkIntegration?: string
    sessionId?: string
    enableCallback?: boolean
}
export declare function getPhoenixTracer(options: PhoenixTracerOptions): Tracer | undefined
export declare function tryJsonStringify(obj: unknown, fallback: string): string
export declare function elapsed(run: Run): string
export declare class ConsoleCallbackHandler extends BaseTracer {
    name: 'console_callback_handler'
    logger: Logger
    orgId?: string
    protected persistRun(_run: Run): Promise<void>
    constructor(logger: Logger, orgId?: string)
    getParents(run: Run): Run[]
    getBreadcrumbs(run: Run): string
    onChainStart(run: Run): void
    onChainEnd(run: Run): void
    onChainError(run: Run): void
    onLLMStart(run: Run): void
    onLLMEnd(run: Run): void
    onLLMError(run: Run): void
    onToolStart(run: Run): void
    onToolEnd(run: Run): void
    onToolError(run: Run): void
    onAgentAction(run: Run): void
}
/**
 * Custom chain handler class
 */
export declare class CustomChainHandler extends BaseCallbackHandler {
    name: string
    isLLMStarted: boolean
    skipK: number
    returnSourceDocuments: boolean
    cachedResponse: boolean
    chatId: string
    sseStreamer: IServerSideEventStreamer | undefined
    constructor(sseStreamer: IServerSideEventStreamer | undefined, chatId: string, skipK?: number, returnSourceDocuments?: boolean)
    handleLLMStart(): void
    handleLLMNewToken(
        token: string,
        idx?: NewTokenIndices,
        runId?: string,
        parentRunId?: string,
        tags?: string[],
        fields?: HandleLLMNewTokenCallbackFields
    ): void | Promise<void>
    handleLLMEnd(): void
    handleChainEnd(outputs: ChainValues, _: string, parentRunId?: string): void | Promise<void>
}
export declare const additionalCallbacks: (nodeData: INodeData, options: ICommonObject) => Promise<any>
export declare class AnalyticHandler {
    private static instances
    private nodeData
    private options
    private handlers
    private initialized
    private analyticsConfig
    private chatId
    private createdAt
    private constructor()
    static getInstance(nodeData: INodeData, options: ICommonObject): AnalyticHandler
    static resetInstance(chatId: string): void
    static cleanup(maxAge?: number): void
    /**
     * Helper method to end an OpenTelemetry span with output, token usage, and model name attributes.
     * Used by arize, phoenix, and opik providers.
     */
    private _endOtelSpan
    init(): Promise<void>
    hasActiveProviders(): boolean
    getHandlers(): ICommonObject
    initializeProvider(provider: string, providerConfig: any, credentialData: any): Promise<void>
    onChainStart(name: string, input: string, parentIds?: ICommonObject): Promise<ICommonObject>
    onChainEnd(returnIds: ICommonObject, output: string | object, shutdown?: boolean): Promise<void>
    onChainError(returnIds: ICommonObject, error: string | object, shutdown?: boolean): Promise<void>
    onLLMStart(name: string, input: string | BaseMessageLike[], parentIds: ICommonObject): Promise<ICommonObject>
    onLLMEnd(
        returnIds: ICommonObject,
        output: string | ICommonObject,
        {
            model,
            provider
        }?: {
            model?: string
            provider?: string
        }
    ): Promise<void>
    onLLMError(returnIds: ICommonObject, error: string | object): Promise<void>
    onToolStart(name: string, input: string | object, parentIds: ICommonObject): Promise<ICommonObject>
    onToolEnd(returnIds: ICommonObject, output: string | object): Promise<void>
    onToolError(returnIds: ICommonObject, error: string | object): Promise<void>
}
/**
 * Custom callback handler for streaming detailed intermediate information
 * during agent execution, specifically tool invocation inputs and outputs.
 */
export declare class CustomStreamingHandler extends BaseCallbackHandler {
    name: string
    private sseStreamer
    private chatId
    constructor(sseStreamer: IServerSideEventStreamer, chatId: string)
    /**
     * Handle the start of a tool invocation
     */
    handleToolStart(tool: Serialized, input: string, runId: string, parentRunId?: string): Promise<void>
    /**
     * Handle the end of a tool invocation
     */
    handleToolEnd(output: string | object, runId: string, parentRunId?: string): Promise<void>
    /**
     * Handle tool errors
     */
    handleToolError(error: Error, runId: string, parentRunId?: string): Promise<void>
    /**
     * Handle agent actions
     */
    handleAgentAction(action: AgentAction, runId: string, parentRunId?: string): Promise<void>
}
export {}
