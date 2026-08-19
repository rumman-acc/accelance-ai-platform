"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scopes = ['openid', 'offline_access', 'Files.Read', 'Files.Read.All', 'Files.ReadWrite', 'Files.ReadWrite.All'];
class OneDriveOAuth2 {
    constructor() {
        this.label = 'OneDrive OAuth2';
        this.name = 'oneDriveOAuth2';
        this.version = 1.0;
        this.description =
            'You can find the setup instructions <a target="_blank" href="https://docs.flowiseai.com/integrations/langchain/tools/microsoft-outlook">here</a>';
        this.inputs = [
            {
                label: 'Authorization URL',
                name: 'authorizationUrl',
                type: 'string',
                default: 'https://login.microsoftonline.com/<tenantId>/oauth2/v2.0/authorize'
            },
            {
                label: 'Access Token URL',
                name: 'accessTokenUrl',
                type: 'string',
                default: 'https://login.microsoftonline.com/<tenantId>/oauth2/v2.0/token'
            },
            {
                label: 'Client ID',
                name: 'clientId',
                type: 'string'
            },
            {
                label: 'Client Secret',
                name: 'clientSecret',
                type: 'password'
            },
            {
                label: 'Scope',
                name: 'scope',
                type: 'string',
                hidden: true,
                default: scopes.join(' ')
            }
        ];
    }
}
module.exports = { credClass: OneDriveOAuth2 };
//# sourceMappingURL=OneDriveOAuth2.credential.js.map