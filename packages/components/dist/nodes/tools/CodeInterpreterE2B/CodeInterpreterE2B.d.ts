import { ICommonObject } from '../../../src/Interface'
import { StructuredTool, ToolParams } from '@langchain/core/tools'
import { Sandbox } from '@e2b/code-interpreter'
import { z } from 'zod/v3'
import { CallbackManagerForToolRun, Callbacks } from '@langchain/core/callbacks/manager'
import { RunnableConfig } from '@langchain/core/runnables'
type E2BToolParams = ToolParams
type E2BToolInput = {
    name: string
    description: string
    apiKey: string
    schema: any
    chatflowid: string
    orgId: string
    templateCodeInterpreterE2B?: string
    domainCodeInterpreterE2B?: string
}
export declare class E2BTool extends StructuredTool {
    static lc_name(): string
    name: string
    description: string
    instance: Sandbox
    apiKey: string
    schema: any
    chatflowid: string
    orgId: string
    flowObj: ICommonObject
    templateCodeInterpreterE2B?: string
    domainCodeInterpreterE2B?: string
    constructor(options: E2BToolParams & E2BToolInput)
    static initialize(options: Partial<E2BToolParams> & E2BToolInput): Promise<E2BTool>
    call(
        arg: z.infer<typeof this.schema>,
        configArg?: RunnableConfig | Callbacks,
        tags?: string[],
        flowConfig?: {
            sessionId?: string
            chatId?: string
            input?: string
            state?: ICommonObject
        }
    ): Promise<string>
    protected _call(
        arg: z.infer<typeof this.schema>,
        _?: CallbackManagerForToolRun,
        flowConfig?: {
            sessionId?: string
            chatId?: string
            input?: string
        }
    ): Promise<string>
    setFlowObject(flowObj: ICommonObject): void
}
export {}
