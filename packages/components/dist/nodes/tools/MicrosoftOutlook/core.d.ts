import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to access Microsoft Outlook API for managing calendars, events, and messages";
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
    name?: string;
    actions?: string[];
    accessToken?: string;
    defaultParams?: any;
}
export declare const createOutlookTools: (args?: RequestParameters) => DynamicStructuredTool[];
