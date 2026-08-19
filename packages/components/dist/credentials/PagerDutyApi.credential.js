'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
class PagerDutyApi {
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
//# sourceMappingURL=PagerDutyApi.credential.js.map
