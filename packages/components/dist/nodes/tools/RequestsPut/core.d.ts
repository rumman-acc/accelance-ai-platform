import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to execute a PUT request to update or replace a resource.";
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
    bodySchema?: string;
    maxOutputLength?: number;
}
export declare class RequestsPutTool extends DynamicStructuredTool {
    url: string;
    maxOutputLength: number;
    headers: {};
    body: {};
    bodySchema?: string;
    constructor(args?: RequestParameters);
    /** @ignore */
    _call(arg: any): Promise<string>;
}
