import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to access Shopify Admin API for managing products and orders'
export interface Headers {
    [key: string]: string
}
export interface Body {
    [key: string]: any
}
export interface RequestParameters {
    headers?: Headers
    body?: Body
    url?: string
    description?: string
    maxOutputLength?: number
    name?: string
    actions?: string[]
    shopDomain?: string
    adminAccessToken?: string
    apiVersion?: string
    defaultParams?: any
}
export declare const createShopifyTools: (args?: RequestParameters) => DynamicStructuredTool[]
