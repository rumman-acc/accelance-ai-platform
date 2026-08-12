import { INodeParams, INodeCredential } from '../src/Interface'

class FreshdeskApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Freshdesk API'
        this.name = 'freshdeskApi'
        this.version = 1.0
        this.inputs = [
            {
                label: 'Domain',
                name: 'domain',
                type: 'string',
                placeholder: 'yourcompany',
                description: 'the part before .freshdesk.com in your Freshdesk URL'
            },
            {
                label: 'API Key',
                name: 'apiKey',
                type: 'password'
            }
        ]
    }
}

module.exports = { credClass: FreshdeskApi }
