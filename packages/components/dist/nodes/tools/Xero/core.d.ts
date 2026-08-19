import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to access Xero API for managing invoices, contacts, and accounts";
export interface RequestParameters {
    actions?: string[];
    tenantId?: string;
    accessToken?: string;
    maxOutputLength?: number;
}
export declare const createXeroTools: (args?: RequestParameters) => DynamicStructuredTool[];
