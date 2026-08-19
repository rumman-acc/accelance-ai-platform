import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to delegate a question or task to GPT as a callable sub-agent";
export interface Headers {
    [key: string]: string;
}
export interface Body {
    [key: string]: any;
}
export interface RequestParameters {
    model?: string;
    apiKey?: string;
    maxOutputLength?: number;
}
export declare const createGptAgentTools: (args?: RequestParameters) => DynamicStructuredTool[];
