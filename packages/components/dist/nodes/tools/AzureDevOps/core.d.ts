import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to access Azure DevOps API for managing projects, work items, and repositories";
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
    organization?: string;
    personalAccessToken?: string;
    defaultParams?: any;
}
export declare const createAzureDevOpsTools: (args?: RequestParameters) => DynamicStructuredTool[];
