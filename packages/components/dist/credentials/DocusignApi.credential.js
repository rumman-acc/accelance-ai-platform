"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DocusignApi {
    constructor() {
        this.label = 'DocuSign API';
        this.name = 'docusignApi';
        this.version = 1.0;
        this.description =
            "Requires a pre-obtained OAuth2 access token (via DocuSign's JWT Grant or Authorization Code flow). This connector does not perform the OAuth dance itself. Access tokens are short-lived, so this is best suited to automation where the token is refreshed externally/periodically.";
        this.inputs = [
            {
                label: 'Account Base URI',
                name: 'accountBaseUri',
                type: 'string',
                placeholder: 'https://na3.docusign.net/restapi',
                description: "Your account's base URI, found via DocuSign's OAuth userinfo endpoint or the eSignature API quickstart"
            },
            {
                label: 'Account ID',
                name: 'accountId',
                type: 'string',
                placeholder: '<DOCUSIGN_ACCOUNT_ID>'
            },
            {
                label: 'Access Token',
                name: 'accessToken',
                type: 'password',
                placeholder: '<DOCUSIGN_ACCESS_TOKEN>'
            }
        ];
    }
}
module.exports = { credClass: DocusignApi };
//# sourceMappingURL=DocusignApi.credential.js.map