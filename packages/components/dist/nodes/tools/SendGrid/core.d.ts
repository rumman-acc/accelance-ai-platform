import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to access SendGrid API for sending email and managing marketing contacts";
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
    defaultParams?: any;
}
export declare const createSendGridTools: (args?: RequestParameters) => DynamicStructuredTool[];
