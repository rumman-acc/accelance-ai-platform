import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to access Datadog API for querying metrics and managing monitors";
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
    apiKey?: string;
    appKey?: string;
    site?: string;
    defaultParams?: any;
}
export declare const createDatadogTools: (args?: RequestParameters) => DynamicStructuredTool[];
