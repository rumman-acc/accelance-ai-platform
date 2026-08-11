import { INodeParams, INodeCredential } from '../src/Interface'

class HubspotApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'HubSpot API'
        this.name = 'hubspotApi'
        this.version = 1.0
        this.description =
            'HubSpot Private App access token. Create one under Settings &rarr; Integrations &rarr; Private Apps in your HubSpot account. HubSpot recommends Private Apps over full OAuth for server-to-server integrations. See the <a target="_blank" href="https://developers.hubspot.com/docs/api/private-apps">official guide</a> for details.'
        this.inputs = [
            {
                label: 'Private App Access Token',
                name: 'privateAppToken',
                type: 'password',
                placeholder: '<HUBSPOT_PRIVATE_APP_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: HubspotApi }
