import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to access Google Sheets API for managing spreadsheets and values";
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
export declare const createGoogleSheetsTools: (args?: RequestParameters) => DynamicStructuredTool[];
