import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to send analytics events to Amplitude";
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
    secretKey?: string;
    defaultParams?: any;
}
export declare const createAmplitudeTools: (args?: RequestParameters) => DynamicStructuredTool[];
