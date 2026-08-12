import { INodeParams, INodeCredential } from '../src/Interface'

class KlaviyoApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Klaviyo API'
        this.name = 'klaviyoApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://www.klaviyo.com/settings/account/api-keys">Klaviyo Settings → API Keys → Private API Keys</a> to create a private API key'
        this.inputs = [
            {
                label: 'Private API Key',
                name: 'privateApiKey',
                type: 'password',
                placeholder: '<KLAVIYO_PRIVATE_API_KEY>'
            }
        ]
    }
}

module.exports = { credClass: KlaviyoApi }
