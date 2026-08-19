import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to access monday.com API for managing boards and items";
export interface RequestParameters {
    actions?: string[];
    apiToken?: string;
    maxOutputLength?: number;
}
/**
 * Makes a request to the monday.com GraphQL API.
 * monday.com exposes a single endpoint and returns HTTP 200 even when the
 * GraphQL query/mutation itself failed, so callers must inspect the `errors`
 * array in the response body.
 */
export declare function makeMondayRequest(apiToken: string, query: string, variables?: Record<string, any>): Promise<any>;
export declare const createMondayTools: (args?: RequestParameters) => DynamicStructuredTool[];
