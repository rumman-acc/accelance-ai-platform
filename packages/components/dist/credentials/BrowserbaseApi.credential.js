'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
class BrowserbaseApi {
    constructor() {
        this.label = 'Browserbase API'
        this.name = 'browserbaseApi'
        this.version = 1.0
        this.description =
            'API key and Project ID from your <a target="_blank" href="https://www.browserbase.com/settings">Browserbase settings</a>.'
        this.inputs = [
            {
                label: 'API Key',
                name: 'browserbaseApiKey',
                type: 'password',
                placeholder: '<BROWSERBASE_API_KEY>'
            },
            {
                label: 'Project ID',
                name: 'browserbaseProjectId',
                type: 'string',
                placeholder: '<BROWSERBASE_PROJECT_ID>'
            }
        ]
    }
}
module.exports = { credClass: BrowserbaseApi }
//# sourceMappingURL=BrowserbaseApi.credential.js.map
