import { ChatOllama as LCChatOllama, ChatOllamaInput } from '@langchain/ollama'
import { IMultiModalOption, IVisionChatModal } from '../../../src'
export declare class ChatOllama extends LCChatOllama implements IVisionChatModal {
    configuredModel: string
    configuredMaxToken?: number
    multiModalOption: IMultiModalOption
    id: string
    constructor(id: string, fields?: ChatOllamaInput)
    setMultiModalOption(multiModalOption: IMultiModalOption): void
}
