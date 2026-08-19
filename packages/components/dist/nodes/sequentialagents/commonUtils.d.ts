import { StructuredTool } from '@langchain/core/tools';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { BaseMessage, MessageContentImageUrl } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ICommonObject, INodeData, ISeqAgentsState, ConversationHistorySelection } from '../../src/Interface';
import { ChatPromptTemplate, BaseMessagePromptTemplateLike } from '@langchain/core/prompts';
export declare const checkCondition: (input: string | number | undefined, condition: string, value?: string | number) => boolean;
export declare const transformObjectPropertyToFunction: (obj: ICommonObject, state: ISeqAgentsState) => ICommonObject;
export declare const processImageMessage: (llm: BaseChatModel, nodeData: INodeData, options: ICommonObject) => Promise<MessageContentImageUrl[]>;
export declare const customGet: (obj: any, path: string) => any;
export declare const convertStructuredSchemaToZod: (schema: string | object) => ICommonObject;
/**
 * Filter the conversation history based on the selected option.
 *
 * @param historySelection - The selected history option.
 * @param input - The user input.
 * @param state - The current state of the sequential llm or agent node.
 */
export declare function filterConversationHistory(historySelection: ConversationHistorySelection, input: string, state: ISeqAgentsState): BaseMessage[];
export declare const restructureMessages: (llm: BaseChatModel, state: ISeqAgentsState) => BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[];
export declare class ExtractTool extends StructuredTool {
    name: string;
    description: string;
    schema: any;
    constructor(fields: ICommonObject);
    _call(input: any): Promise<string>;
}
export interface RunnableCallableArgs extends Partial<any> {
    name?: string;
    func: (...args: any[]) => any;
    tags?: string[];
    trace?: boolean;
    recurse?: boolean;
}
export interface MessagesState {
    messages: BaseMessage[];
}
export declare class RunnableCallable<I = unknown, O = unknown> extends Runnable<I, O> {
    lc_namespace: string[];
    func: (...args: any[]) => any;
    tags?: string[];
    config?: RunnableConfig;
    trace: boolean;
    recurse: boolean;
    constructor(fields: RunnableCallableArgs);
    invoke(input: any, options?: Partial<RunnableConfig> | undefined): Promise<any>;
}
export declare const checkMessageHistory: (nodeData: INodeData, options: ICommonObject, prompt: ChatPromptTemplate, promptArrays: BaseMessagePromptTemplateLike[], sysPrompt: string) => Promise<ChatPromptTemplate<any, any>>;
