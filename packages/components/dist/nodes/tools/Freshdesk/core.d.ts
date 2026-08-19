import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to access Freshdesk API for managing support tickets and contacts";
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
    domain?: string;
    apiKey?: string;
    defaultParams?: any;
}
export declare const createFreshdeskTools: (args?: RequestParameters) => DynamicStructuredTool[];
