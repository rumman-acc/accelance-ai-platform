import { ChatPerplexity as LangchainChatPerplexity, type PerplexityChatInput } from '@langchain/community/chat_models/perplexity';
import { IMultiModalOption, IVisionChatModal } from '../../../src';
export declare class ChatPerplexity extends LangchainChatPerplexity implements IVisionChatModal {
    configuredModel: string;
    configuredMaxToken?: number;
    multiModalOption: IMultiModalOption;
    id: string;
    constructor(id: string, fields: PerplexityChatInput);
    setMultiModalOption(multiModalOption: IMultiModalOption): void;
}
