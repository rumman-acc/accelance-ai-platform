import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you need to execute a DELETE request to remove data from a website.";
export interface Headers {
    [key: string]: string;
}
export interface RequestParameters {
    headers?: Headers;
    url?: string;
    name?: string;
    queryParamsSchema?: string;
    description?: string;
    maxOutputLength?: number;
}
export declare class RequestsDeleteTool extends DynamicStructuredTool {
    url: string;
    maxOutputLength: number;
    headers: {};
    queryParamsSchema?: string;
    constructor(args?: RequestParameters);
    /** @ignore */
    _call(arg: any): Promise<string>;
}
