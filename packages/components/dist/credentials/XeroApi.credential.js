'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
class XeroApi {
    constructor() {
        this.label = 'Xero API'
        this.name = 'xeroApi'
        this.version = 1.0
        this.description =
            "Requires a pre-obtained OAuth2 access token for Xero, paired with the Tenant ID for the organisation you want to access (fetched from Xero's <code>/connections</code> endpoint after authorizing). This connector does not perform the OAuth authorization flow itself. Xero access tokens are short-lived (~30 minutes) and this connector does not handle refreshing them, so you will need to re-obtain and update the token periodically."
        this.inputs = [
            {
                label: 'Tenant ID',
                name: 'tenantId',
                type: 'string',
                placeholder: '<XERO_TENANT_ID>'
            },
            {
                label: 'Access Token',
                name: 'accessToken',
                type: 'password',
                placeholder: '<XERO_ACCESS_TOKEN>'
            }
        ]
    }
}
module.exports = { credClass: XeroApi }
//# sourceMappingURL=XeroApi.credential.js.map
