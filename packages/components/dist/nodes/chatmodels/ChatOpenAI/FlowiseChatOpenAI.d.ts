import { ChatOpenAI as LangchainChatOpenAI, ChatOpenAIFields } from '@langchain/openai';
import { IMultiModalOption, IVisionChatModal } from '../../../src';
export declare class ChatOpenAI extends LangchainChatOpenAI implements IVisionChatModal {
    configuredModel: string;
    configuredMaxToken?: number;
    multiModalOption: IMultiModalOption;
    builtInTools: Record<string, any>[];
    id: string;
    constructor(id: string, fields?: ChatOpenAIFields);
    setMultiModalOption(multiModalOption: IMultiModalOption): void;
    addBuiltInTools(builtInTool: Record<string, any>): void;
}
