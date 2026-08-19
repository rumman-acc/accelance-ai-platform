import { ChainValues } from '@langchain/core/utils/types'
import { AgentStep, AgentAction } from '@langchain/core/agents'
import { BaseMessage } from '@langchain/core/messages'
import { OutputParserException, BaseOutputParser, BaseLLMOutputParser } from '@langchain/core/output_parsers'
import { CallbackManagerForChainRun, Callbacks } from '@langchain/core/callbacks/manager'
import { ToolInputParsingException, Tool } from '@langchain/core/tools'
import { RunnableSequence, type RunnableConfig } from '@langchain/core/runnables'
import { Serializable } from '@langchain/core/load/serializable'
import { ChatGeneration } from '@langchain/core/outputs'
import { BaseChain, SerializedLLMChain } from '@langchain/classic/chains'
import {
    CreateReactAgentParams,
    AgentExecutorInput,
    AgentActionOutputParser,
    BaseSingleActionAgent,
    BaseMultiActionAgent,
    StoppingMethod
} from '@langchain/classic/agents'
export declare const SOURCE_DOCUMENTS_PREFIX = '\n\n----FLOWISE_SOURCE_DOCUMENTS----\n\n'
export declare const ARTIFACTS_PREFIX = '\n\n----FLOWISE_ARTIFACTS----\n\n'
export declare const TOOL_ARGS_PREFIX = '\n\n----FLOWISE_TOOL_ARGS----\n\n'
/**
 * Utility function to format tool error messages with parameters for debugging
 * @param errorMessage - The base error message
 * @param params - The parameters that were passed to the tool
 * @returns Formatted error message with tool arguments appended
 */
export declare const formatToolError: (errorMessage: string, params: any) => string
export type AgentFinish = {
    returnValues: Record<string, any>
    log: string
}
type AgentExecutorOutput = ChainValues
interface AgentExecutorIteratorInput {
    agentExecutor: AgentExecutor
    inputs: Record<string, string>
    config?: RunnableConfig
    callbacks?: Callbacks
    tags?: string[]
    metadata?: Record<string, unknown>
    runName?: string
    runManager?: CallbackManagerForChainRun
}
export declare class AgentExecutorIterator extends Serializable implements AgentExecutorIteratorInput {
    lc_namespace: string[]
    agentExecutor: AgentExecutor
    inputs: Record<string, string>
    config?: RunnableConfig
    callbacks: Callbacks
    tags: string[] | undefined
    metadata: Record<string, unknown> | undefined
    runName: string | undefined
    private _finalOutputs
    get finalOutputs(): Record<string, unknown> | undefined
    /** Intended to be used as a setter method, needs to be async. */
    setFinalOutputs(value: Record<string, unknown> | undefined): Promise<void>
    runManager: CallbackManagerForChainRun | undefined
    intermediateSteps: AgentStep[]
    iterations: number
    get nameToToolMap(): Record<string, Tool>
    constructor(fields: AgentExecutorIteratorInput)
    /**
     * Reset the iterator to its initial state, clearing intermediate steps,
     * iterations, and the final output.
     */
    reset(): void
    updateIterations(): void
    streamIterator(): AsyncGenerator<Record<string, unknown>, Record<string, unknown>, unknown>
    /**
     * Perform any necessary setup for the first step
     * of the asynchronous iterator.
     */
    onFirstStep(): Promise<void>
    /**
     * Execute the next step in the chain using the
     * AgentExecutor's _takeNextStep method.
     */
    _executeNextStep(runManager?: CallbackManagerForChainRun): Promise<AgentFinish | AgentStep[]>
    /**
     * Process the output of the next step,
     * handling AgentFinish and tool return cases.
     */
    _processNextStepOutput(
        nextStepOutput: AgentFinish | AgentStep[],
        runManager?: CallbackManagerForChainRun
    ): Promise<Record<string, string | AgentStep[]>>
    _stop(): Promise<Record<string, unknown>>
    _callNext(): Promise<Record<string, unknown>>
}
export declare class AgentExecutor extends BaseChain<ChainValues, AgentExecutorOutput> {
    static lc_name(): string
    get lc_namespace(): string[]
    agent: BaseSingleActionAgent | BaseMultiActionAgent
    tools: this['agent']['ToolType'][]
    returnIntermediateSteps: boolean
    maxIterations?: number
    earlyStoppingMethod: StoppingMethod
    sessionId?: string
    chatId?: string
    input?: string
    isXML?: boolean
    /**
     * How to handle errors raised by the agent's output parser.
        Defaults to `False`, which raises the error.

        If `true`, the error will be sent back to the LLM as an observation.
        If a string, the string itself will be sent to the LLM as an observation.
        If a callable function, the function will be called with the exception
        as an argument, and the result of that function will be passed to the agent
        as an observation.
    */
    handleParsingErrors: boolean | string | ((e: OutputParserException | ToolInputParsingException) => string)
    handleToolRuntimeErrors?: (e: Error) => string
    get inputKeys(): string[]
    get outputKeys(): string[]
    constructor(
        input: AgentExecutorInput & {
            sessionId?: string
            chatId?: string
            input?: string
            isXML?: boolean
        }
    )
    static fromAgentAndTools(
        fields: AgentExecutorInput & {
            sessionId?: string
            chatId?: string
            input?: string
            isXML?: boolean
        }
    ): AgentExecutor
    get shouldContinueGetter(): (iterations: number) => boolean
    /**
     * Method that checks if the agent execution should continue based on the
     * number of iterations.
     * @param iterations The current number of iterations.
     * @returns A boolean indicating whether the agent execution should continue.
     */
    private shouldContinue
    _call(inputs: ChainValues, runManager?: CallbackManagerForChainRun, config?: RunnableConfig): Promise<AgentExecutorOutput>
    _takeNextStep(
        nameToolMap: Record<string, Tool>,
        inputs: ChainValues,
        intermediateSteps: AgentStep[],
        runManager?: CallbackManagerForChainRun,
        config?: RunnableConfig
    ): Promise<AgentFinish | AgentStep[]>
    _return(output: AgentFinish, intermediateSteps: AgentStep[], runManager?: CallbackManagerForChainRun): Promise<AgentExecutorOutput>
    _getToolReturn(nextStepOutput: AgentStep): Promise<AgentFinish | null>
    _returnStoppedResponse(earlyStoppingMethod: StoppingMethod): AgentFinish
    _streamIterator(inputs: Record<string, any>, options?: Partial<RunnableConfig>): AsyncGenerator<ChainValues>
    _chainType(): 'agent_executor'
    serialize(): SerializedLLMChain
}
export declare const formatAgentSteps: (steps: AgentStep[]) => BaseMessage[]
export declare const createReactAgent: ({ llm, tools, prompt }: CreateReactAgentParams) => Promise<
    RunnableSequence<
        {
            steps: AgentStep[]
        },
        AgentAction | import('@langchain/core/agents').AgentFinish
    >
>
export declare class XMLAgentOutputParser extends AgentActionOutputParser {
    lc_namespace: string[]
    static lc_name(): string
    /**
     * Parses the output text from the agent and returns an AgentAction or
     * AgentFinish object.
     * @param text The output text from the agent.
     * @returns An AgentAction or AgentFinish object.
     */
    parse(text: string): Promise<AgentAction | AgentFinish>
    getFormatInstructions(): string
}
declare abstract class AgentMultiActionOutputParser extends BaseOutputParser<AgentAction[] | AgentFinish> {}
export type ToolsAgentAction = AgentAction & {
    toolCallId: string
    messageLog?: BaseMessage[]
}
export type ToolsAgentStep = AgentStep & {
    action: ToolsAgentAction
}
export declare class ToolCallingAgentOutputParser extends AgentMultiActionOutputParser {
    lc_namespace: string[]
    static lc_name(): string
    parse(text: string): Promise<AgentAction[] | AgentFinish>
    parseResult(generations: ChatGeneration[]): Promise<AgentFinish | ToolsAgentAction[]>
    getFormatInstructions(): string
}
export type ParsedToolCall = {
    id?: string
    type: string
    args: Record<string, any>
    /** @deprecated Use `type` instead. Will be removed in 0.2.0. */
    name: string
    /** @deprecated Use `args` instead. Will be removed in 0.2.0. */
    arguments: Record<string, any>
}
export type JsonOutputToolsParserParams = {
    /** Whether to return the tool call id. */
    returnId?: boolean
}
export declare class JsonOutputToolsParser extends BaseLLMOutputParser<ParsedToolCall[]> {
    static lc_name(): string
    returnId: boolean
    lc_namespace: string[]
    lc_serializable: boolean
    constructor(fields?: JsonOutputToolsParserParams)
    /**
     * Parses the output and returns a JSON object. If `argsOnly` is true,
     * only the arguments of the function call are returned.
     * @param generations The output of the LLM to parse.
     * @returns A JSON object representation of the function call or its arguments.
     */
    parseResult(generations: ChatGeneration[]): Promise<ParsedToolCall[]>
}
export {}
