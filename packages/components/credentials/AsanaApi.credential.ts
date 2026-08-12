import { INodeParams, INodeCredential } from '../src/Interface'

class AsanaApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Asana API'
        this.name = 'asanaApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://developers.asana.com/docs/personal-access-token">official guide</a> on how to generate a Personal Access Token from Asana\'s Developer Console (My Settings → Apps → Manage Developer Apps → Personal Access Tokens)'
        this.inputs = [
            {
                label: 'Personal Access Token',
                name: 'personalAccessToken',
                type: 'password',
                placeholder: '<ASANA_PERSONAL_ACCESS_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: AsanaApi }
