import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to access Salesforce API for querying and managing records such as Leads, Contacts, Accounts, Opportunities, or any custom object";
export interface RequestParameters {
    actions?: string[];
    instanceUrl?: string;
    accessToken?: string;
    apiVersion?: string;
    maxOutputLength?: number;
}
export declare const createSalesforceTools: (args?: RequestParameters) => DynamicStructuredTool[];
