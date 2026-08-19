import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to access DocuSign API for sending documents for e-signature and checking envelope status";
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
    accountBaseUri?: string;
    accountId?: string;
    accessToken?: string;
    defaultParams?: any;
}
export declare const createDocusignTools: (args?: RequestParameters) => DynamicStructuredTool[];
