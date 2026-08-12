import { INodeParams, INodeCredential } from '../src/Interface'

class ClickUpApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'ClickUp API'
        this.name = 'clickupApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://clickup.com/api">official guide</a> on how to get an API token from ClickUp Settings → Apps → API Token'
        this.inputs = [
            {
                label: 'API Token',
                name: 'apiToken',
                type: 'password',
                placeholder: '<CLICKUP_API_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: ClickUpApi }
