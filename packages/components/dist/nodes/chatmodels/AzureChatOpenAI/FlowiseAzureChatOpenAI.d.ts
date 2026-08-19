import { AzureChatOpenAI as LangchainAzureChatOpenAI } from '@langchain/openai'
import { IMultiModalOption, IVisionChatModal } from '../../../src'
export type AzureChatOpenAIConstructorFields = ConstructorParameters<typeof LangchainAzureChatOpenAI>[0]
export declare class AzureChatOpenAI extends LangchainAzureChatOpenAI implements IVisionChatModal {
    configuredModel: string
    configuredMaxToken?: number
    multiModalOption: IMultiModalOption
    builtInTools: Record<string, any>[]
    id: string
    constructor(id: string, fields?: AzureChatOpenAIConstructorFields)
    setMultiModalOption(multiModalOption: IMultiModalOption): void
    addBuiltInTools(builtInTool: Record<string, any>): void
}
