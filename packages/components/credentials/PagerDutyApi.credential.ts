import { INodeParams, INodeCredential } from '../src/Interface'

class PagerDutyApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'PagerDuty API'
        this.name = 'pagerdutyApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://support.pagerduty.com/docs/generating-api-keys">official guide</a> on how to get an API key from PagerDuty. Go to My Profile > User Settings > API Access Keys to generate a token.'
        this.inputs = [
            {
                label: 'API Token',
                name: 'apiToken',
                type: 'password',
                placeholder: '<PAGERDUTY_API_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: PagerDutyApi }
