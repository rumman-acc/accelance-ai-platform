import { ChatOpenAI as LangchainChatOpenAI, ChatOpenAIFields } from '@langchain/openai'
import { IMultiModalOption, IVisionChatModal } from '../../../src'
export declare class ChatOpenRouter extends LangchainChatOpenAI implements IVisionChatModal {
    configuredModel: string
    configuredMaxToken?: number
    multiModalOption: IMultiModalOption
    id: string
    constructor(id: string, fields?: ChatOpenAIFields)
    setMultiModalOption(multiModalOption: IMultiModalOption): void
}
