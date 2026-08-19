import { ChatXAI as LCChatXAI, ChatXAIInput } from '@langchain/xai'
import { IMultiModalOption, IVisionChatModal } from '../../../src'
export declare class ChatXAI extends LCChatXAI implements IVisionChatModal {
    configuredModel: string
    configuredMaxToken?: number
    multiModalOption: IMultiModalOption
    id: string
    constructor(id: string, fields?: ChatXAIInput)
    setMultiModalOption(multiModalOption: IMultiModalOption): void
}
