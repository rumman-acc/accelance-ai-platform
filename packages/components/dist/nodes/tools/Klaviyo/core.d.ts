import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to access Klaviyo API for managing profiles and lists";
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
    privateApiKey?: string;
    defaultParams?: any;
}
export declare const createKlaviyoTools: (args?: RequestParameters) => DynamicStructuredTool[];
