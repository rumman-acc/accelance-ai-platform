import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createShopifyTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Shopify_Tools implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

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

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const shopDomain = getCredentialParam('shopDomain', credentialData, nodeData)
        const adminAccessToken = getCredentialParam('adminAccessToken', credentialData, nodeData)

        if (!shopDomain) {
            throw new Error('No Shopify shop domain provided')
        }

        if (!adminAccessToken) {
            throw new Error('No Shopify Admin API access token provided')
        }

        const apiVersion = (nodeData.inputs?.apiVersion as string) || '2025-01'
        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createShopifyTools({
            actions,
            shopDomain,
            adminAccessToken,
            apiVersion
        })

        return tools
    }
}

module.exports = { nodeClass: Shopify_Tools }
