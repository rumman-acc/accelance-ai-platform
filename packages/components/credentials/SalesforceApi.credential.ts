import { INodeParams, INodeCredential } from '../src/Interface'

class SalesforceApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Salesforce API'
        this.name = 'salesforceApi'
        this.version = 1.0
        this.description =
            "Requires a pre-obtained OAuth2 access token for your Salesforce org (e.g. from a Connected App client-credentials or JWT bearer grant, or via <code>sf org display --verbose</code>), paired with the org's instance URL. This connector does not perform the OAuth authorization flow itself."
        this.inputs = [
            {
                label: 'Instance URL',
                name: 'instanceUrl',
                type: 'string',
                placeholder: 'https://yourorg.my.salesforce.com'
            },
            {
                label: 'Access Token',
                name: 'accessToken',
                type: 'password',
                placeholder: '<SALESFORCE_ACCESS_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: SalesforceApi }
