import { INodeParams, INodeCredential } from '../src/Interface'

class QuickBooksApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'QuickBooks API'
        this.name = 'quickbooksApi'
        this.version = 1.0
        this.description =
            "Requires a pre-obtained OAuth2 access token for your QuickBooks Online company, obtained via QuickBooks' Authorization Code flow, paired with the company's Realm ID (returned during that flow). This connector does not perform the OAuth authorization flow itself. QuickBooks access tokens are short-lived (~1 hour) and this connector does not handle refresh, so it's best suited to workflows where the token is kept fresh externally."
        this.inputs = [
            {
                label: 'Realm ID (Company ID)',
                name: 'realmId',
                type: 'string',
                placeholder: '<QUICKBOOKS_REALM_ID>'
            },
            {
                label: 'Access Token',
                name: 'accessToken',
                type: 'password',
                placeholder: '<QUICKBOOKS_ACCESS_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: QuickBooksApi }
