import { INodeParams, INodeCredential } from '../src/Interface'

class ShopifyApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Shopify API'
        this.name = 'shopifyApi'
        this.version = 1.0
        this.description =
            'Custom App Admin API access token created in your Shopify admin (Settings → Apps and sales channels → Develop apps).'
        this.inputs = [
            {
                label: 'Shop Domain',
                name: 'shopDomain',
                type: 'string',
                placeholder: 'yourstore.myshopify.com'
            },
            {
                label: 'Admin API Access Token',
                name: 'adminAccessToken',
                type: 'password',
                placeholder: '<SHOPIFY_ADMIN_ACCESS_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: ShopifyApi }
