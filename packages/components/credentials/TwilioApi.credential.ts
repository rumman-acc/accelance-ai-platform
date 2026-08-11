import { INodeParams, INodeCredential } from '../src/Interface'

class TwilioApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Twilio API'
        this.name = 'twilioApi'
        this.version = 1.0
        this.description =
            'Refer to your <a target="_blank" href="https://console.twilio.com/">Twilio Console</a> dashboard to find your Account SID and Auth Token'
        this.inputs = [
            {
                label: 'Account SID',
                name: 'accountSid',
                type: 'string',
                placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
            },
            {
                label: 'Auth Token',
                name: 'authToken',
                type: 'password',
                placeholder: '<TWILIO_AUTH_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: TwilioApi }
