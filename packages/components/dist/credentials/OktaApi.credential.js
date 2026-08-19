"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class OktaApi {
    constructor() {
        this.label = 'Okta API';
        this.name = 'oktaApi';
        this.version = 1.0;
        this.description =
            'Generate an API token from the Okta Admin Console under Security → API → Tokens. Refer to <a target="_blank" href="https://help.okta.com/en-us/content/topics/security/api.htm">official guide</a> for more details.';
        this.inputs = [
            {
                label: 'Okta Domain',
                name: 'oktaDomain',
                type: 'string',
                placeholder: 'https://yourorg.okta.com'
            },
            {
                label: 'API Token',
                name: 'apiToken',
                type: 'password',
                placeholder: '<OKTA_API_TOKEN>'
            }
        ];
    }
}
module.exports = { credClass: OktaApi };
//# sourceMappingURL=OktaApi.credential.js.map