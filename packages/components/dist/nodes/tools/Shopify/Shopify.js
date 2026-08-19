'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Shopify_Tools {
    constructor() {
        this.label = 'Shopify'
        this.name = 'shopifyTool'
        this.version = 1.0
        this.type = 'Shopify'
        this.icon = 'shopify.svg'
        this.category = 'Tools'
        this.description = 'Manage Shopify products and orders'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['shopifyApi']
        }
        this.inputs = [
            {
                label: 'API Version',
                name: 'apiVersion',
                type: 'string',
                default: '2025-01',
                description:
                    'Shopify Admin API version to use (e.g. 2025-01). Shopify sunsets API versions roughly a year after release, so this may need to be bumped periodically.'
            },
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Products',
                        name: 'list_products'
                    },
                    {
                        label: 'Create Product',
                        name: 'create_product'
                    },
                    {
                        label: 'Get Product',
                        name: 'get_product'
                    },
                    {
                        label: 'List Orders',
                        name: 'list_orders'
                    },
                    {
                        label: 'Get Order',
                        name: 'get_order'
                    },
                    {
                        label: 'Update Order',
                        name: 'update_order'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const shopDomain = (0, utils_1.getCredentialParam)('shopDomain', credentialData, nodeData)
        const adminAccessToken = (0, utils_1.getCredentialParam)('adminAccessToken', credentialData, nodeData)
        if (!shopDomain) {
            throw new Error('No Shopify shop domain provided')
        }
        if (!adminAccessToken) {
            throw new Error('No Shopify Admin API access token provided')
        }
        const apiVersion = nodeData.inputs?.apiVersion || '2025-01'
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createShopifyTools)({
            actions,
            shopDomain,
            adminAccessToken,
            apiVersion
        })
        return tools
    }
}
module.exports = { nodeClass: Shopify_Tools }
//# sourceMappingURL=Shopify.js.map
