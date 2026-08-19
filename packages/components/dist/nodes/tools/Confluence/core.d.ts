import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to access Confluence API for managing spaces and pages";
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
    username?: string;
    accessToken?: string;
    siteUrl?: string;
    defaultParams?: any;
}
export declare const createConfluenceTools: (args?: RequestParameters) => DynamicStructuredTool[];
