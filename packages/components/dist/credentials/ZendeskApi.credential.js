'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
class ZendeskApi {
    constructor() {
        this.label = 'Zendesk API'
        this.name = 'zendeskApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://support.zendesk.com/hc/en-us/articles/4408889192858-Generating-a-new-API-token">official guide</a> on how to generate an API token on Zendesk'
        this.inputs = [
            {
                label: 'Subdomain',
                name: 'subdomain',
                type: 'string',
                placeholder: 'yourcompany',
                description: 'the part before .zendesk.com in your Zendesk URL'
            },
            {
                label: 'Agent Email',
                name: 'email',
                type: 'string',
                placeholder: 'agent@example.com'
            },
            {
                label: 'API Token',
                name: 'apiToken',
                type: 'password',
                placeholder: '<ZENDESK_API_TOKEN>'
            }
        ]
    }
}
module.exports = { credClass: ZendeskApi }
//# sourceMappingURL=ZendeskApi.credential.js.map
