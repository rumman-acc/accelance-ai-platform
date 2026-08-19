import { AIMessage, BaseMessage } from '@langchain/core/messages';
export interface Config {
    baseUrl: string;
    configurationId: string;
}
export declare class ClientConfig implements Config {
    baseUrl: string;
    configurationId: string;
    constructor(baseUrl: string, configurationId: string);
}
export declare class NemoClient {
    private readonly config;
    constructor(baseUrl: string, configurationId: string);
    getRoleFromMessage(message: BaseMessage): string;
    getContentFromMessage(message: BaseMessage): string;
    buildBody(messages: BaseMessage[], configurationId: string): any;
    chat(messages: BaseMessage[]): Promise<AIMessage[]>;
}
