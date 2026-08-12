import { INodeParams, INodeCredential } from '../src/Interface'

class SendGridApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'SendGrid API'
        this.name = 'sendgridApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://app.sendgrid.com/settings/api_keys">SendGrid Settings &gt; API Keys</a> on how to create an API key'
        this.inputs = [
            {
                label: 'API Key',
                name: 'apiKey',
                type: 'password',
                placeholder: '<SENDGRID_API_KEY>'
            }
        ]
    }
}

module.exports = { credClass: SendGridApi }
