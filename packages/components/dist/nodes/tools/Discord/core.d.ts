import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to send messages and manage channels in a Discord server via a bot";
export interface Headers {
    [key: string]: string;
}
export interface Body {
    [key: string]: any;
}
export interface RequestParameters {
    headers?: Headers;
    body?: Body;
    url?: string;
    description?: string;
    maxOutputLength?: number;
    name?: string;
    actions?: string[];
    botToken?: string;
    defaultParams?: any;
}
export declare const createDiscordTools: (args?: RequestParameters) => DynamicStructuredTool[];
