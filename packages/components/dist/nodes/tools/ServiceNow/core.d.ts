import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to access ServiceNow API for querying and managing records via the Table API";
export interface RequestParameters {
    name?: string;
    actions?: string[];
    instance?: string;
    clientId?: string;
    clientSecret?: string;
    defaultParams?: any;
    maxOutputLength?: number;
}
export declare function getServiceNowAccessToken(instance: string, clientId: string, clientSecret: string): Promise<string>;
export declare const createServiceNowTools: (args?: RequestParameters) => DynamicStructuredTool[];
