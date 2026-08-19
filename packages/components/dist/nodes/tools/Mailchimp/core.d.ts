import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this when you want to access Mailchimp API for managing audiences and campaigns";
export interface Headers {
    [key: string]: string;
}
export interface Body {
    [key: string]: any;
}
export interface MailchimpAuthConfig {
    apiKey: string;
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
    authConfig?: MailchimpAuthConfig;
}
export declare const createMailchimpTools: (args?: RequestParameters) => DynamicStructuredTool[];
