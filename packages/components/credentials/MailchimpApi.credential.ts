import { INodeParams, INodeCredential } from '../src/Interface'

class MailchimpApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Mailchimp API'
        this.name = 'mailchimpApi'
        this.version = 1.0
        this.description =
            'API key from Mailchimp Account &rarr; Extras &rarr; API keys. The key must include its datacenter suffix (e.g. <code>abc123def456-us21</code>) — everything after the last hyphen identifies which regional API server to call'
        this.inputs = [
            {
                label: 'API Key',
                name: 'apiKey',
                type: 'password',
                placeholder: '<key>-us21'
            }
        ]
    }
}

module.exports = { credClass: MailchimpApi }
