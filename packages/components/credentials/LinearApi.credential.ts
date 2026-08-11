import { INodeParams, INodeCredential } from '../src/Interface'

class LinearApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Linear API'
        this.name = 'linearApi'
        this.version = 1.0
        this.description =
            'Personal API key from Linear. Refer to <a target="_blank" href="https://linear.app/docs/api-and-webhooks#personal-api-keys">Linear API docs</a> to create one.'
        this.inputs = [
            {
                label: 'API Key',
                name: 'linearApiKey',
                type: 'password',
                placeholder: '<LINEAR_API_KEY>'
            }
        ]
    }
}

module.exports = { credClass: LinearApi }
