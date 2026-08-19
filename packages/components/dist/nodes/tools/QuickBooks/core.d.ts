import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to access QuickBooks Online API for managing invoices, customers, and accounts";
export interface RequestParameters {
    actions?: string[];
    realmId?: string;
    accessToken?: string;
    maxOutputLength?: number;
}
export declare const createQuickBooksTools: (args?: RequestParameters) => DynamicStructuredTool[];
