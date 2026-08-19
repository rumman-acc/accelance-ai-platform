"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShopifyTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access Shopify Admin API for managing products and orders`;
// Define schemas for different Shopify operations
const ListProductsSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(20).describe('Maximum number of products to return')
});
const CreateProductSchema = v3_1.z.object({
    title: v3_1.z.string().describe('Product title'),
    bodyHtml: v3_1.z.string().optional().describe('Product description (HTML)'),
    vendor: v3_1.z.string().optional().describe('Product vendor'),
    productType: v3_1.z.string().optional().describe('Product type')
});
const GetProductSchema = v3_1.z.object({
    productId: v3_1.z.string().describe('ID of the product to fetch')
});
const ListOrdersSchema = v3_1.z.object({
    status: v3_1.z.string().optional().default('any').describe('Order status filter (e.g., open, closed, cancelled, any)'),
    limit: v3_1.z.number().optional().default(20).describe('Maximum number of orders to return')
});
const GetOrderSchema = v3_1.z.object({
    orderId: v3_1.z.string().describe('ID of the order to fetch')
});
const UpdateOrderSchema = v3_1.z.object({
    orderId: v3_1.z.string().describe('ID of the order to update'),
    note: v3_1.z.string().optional().describe('Note to set on the order'),
    tags: v3_1.z.string().optional().describe('Comma-separated tags to set on the order')
});
class BaseShopifyTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.shopDomain = '';
        this.adminAccessToken = '';
        this.apiVersion = '2025-01';
        this.shopDomain = args.shopDomain ?? '';
        this.adminAccessToken = args.adminAccessToken ?? '';
        this.apiVersion = args.apiVersion ?? '2025-01';
    }
    async makeShopifyRequest({ endpoint, method = 'GET', body, params }) {
        const url = `https://${this.shopDomain}/admin/api/${this.apiVersion}/${endpoint}`;
        const headers = {
            'X-Shopify-Access-Token': this.adminAccessToken,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...this.headers
        };
        const fetchOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        };
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions, 5);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Shopify API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
// Product Tools
class ListProductsTool extends BaseShopifyTool {
    constructor(args) {
        const toolInput = {
            name: 'list_products',
            description: 'List products from Shopify',
            schema: ListProductsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            shopDomain: args.shopDomain,
            adminAccessToken: args.adminAccessToken,
            maxOutputLength: args.maxOutputLength,
            apiVersion: args.apiVersion
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `products.json?limit=${params.limit}`;
            const response = await this.makeShopifyRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing products: ${error}`, params);
        }
    }
}
class CreateProductTool extends BaseShopifyTool {
    constructor(args) {
        const toolInput = {
            name: 'create_product',
            description: 'Create a new product in Shopify',
            schema: CreateProductSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            shopDomain: args.shopDomain,
            adminAccessToken: args.adminAccessToken,
            maxOutputLength: args.maxOutputLength,
            apiVersion: args.apiVersion
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const productData = {
                product: {
                    title: params.title,
                    body_html: params.bodyHtml,
                    vendor: params.vendor,
                    product_type: params.productType
                }
            };
            const response = await this.makeShopifyRequest({ endpoint: 'products.json', method: 'POST', body: productData, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating product: ${error}`, params);
        }
    }
}
class GetProductTool extends BaseShopifyTool {
    constructor(args) {
        const toolInput = {
            name: 'get_product',
            description: 'Get a specific product from Shopify',
            schema: GetProductSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            shopDomain: args.shopDomain,
            adminAccessToken: args.adminAccessToken,
            maxOutputLength: args.maxOutputLength,
            apiVersion: args.apiVersion
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `products/${params.productId}.json`;
            const response = await this.makeShopifyRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting product: ${error}`, params);
        }
    }
}
// Order Tools
class ListOrdersTool extends BaseShopifyTool {
    constructor(args) {
        const toolInput = {
            name: 'list_orders',
            description: 'List orders from Shopify',
            schema: ListOrdersSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            shopDomain: args.shopDomain,
            adminAccessToken: args.adminAccessToken,
            maxOutputLength: args.maxOutputLength,
            apiVersion: args.apiVersion
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `orders.json?status=${params.status}&limit=${params.limit}`;
            const response = await this.makeShopifyRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing orders: ${error}`, params);
        }
    }
}
class GetOrderTool extends BaseShopifyTool {
    constructor(args) {
        const toolInput = {
            name: 'get_order',
            description: 'Get a specific order from Shopify',
            schema: GetOrderSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            shopDomain: args.shopDomain,
            adminAccessToken: args.adminAccessToken,
            maxOutputLength: args.maxOutputLength,
            apiVersion: args.apiVersion
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `orders/${params.orderId}.json`;
            const response = await this.makeShopifyRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting order: ${error}`, params);
        }
    }
}
class UpdateOrderTool extends BaseShopifyTool {
    constructor(args) {
        const toolInput = {
            name: 'update_order',
            description: 'Update an existing order in Shopify',
            schema: UpdateOrderSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        };
        super({
            ...toolInput,
            shopDomain: args.shopDomain,
            adminAccessToken: args.adminAccessToken,
            maxOutputLength: args.maxOutputLength,
            apiVersion: args.apiVersion
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const orderData = {
                order: {
                    id: params.orderId,
                    note: params.note,
                    tags: params.tags
                }
            };
            const endpoint = `orders/${params.orderId}.json`;
            const response = await this.makeShopifyRequest({ endpoint, method: 'PUT', body: orderData, params });
            return response || 'Order updated successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating order: ${error}`, params);
        }
    }
}
const createShopifyTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const shopDomain = args?.shopDomain || '';
    const adminAccessToken = args?.adminAccessToken || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const defaultParams = args?.defaultParams || {};
    const apiVersion = args?.apiVersion || '2025-01';
    if (actions.includes('list_products')) {
        tools.push(new ListProductsTool({
            shopDomain,
            adminAccessToken,
            maxOutputLength,
            defaultParams,
            apiVersion
        }));
    }
    if (actions.includes('create_product')) {
        tools.push(new CreateProductTool({
            shopDomain,
            adminAccessToken,
            maxOutputLength,
            defaultParams,
            apiVersion
        }));
    }
    if (actions.includes('get_product')) {
        tools.push(new GetProductTool({
            shopDomain,
            adminAccessToken,
            maxOutputLength,
            defaultParams,
            apiVersion
        }));
    }
    if (actions.includes('list_orders')) {
        tools.push(new ListOrdersTool({
            shopDomain,
            adminAccessToken,
            maxOutputLength,
            defaultParams,
            apiVersion
        }));
    }
    if (actions.includes('get_order')) {
        tools.push(new GetOrderTool({
            shopDomain,
            adminAccessToken,
            maxOutputLength,
            defaultParams,
            apiVersion
        }));
    }
    if (actions.includes('update_order')) {
        tools.push(new UpdateOrderTool({
            shopDomain,
            adminAccessToken,
            maxOutputLength,
            defaultParams,
            apiVersion
        }));
    }
    return tools;
};
exports.createShopifyTools = createShopifyTools;
//# sourceMappingURL=core.js.map