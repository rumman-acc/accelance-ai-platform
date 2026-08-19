"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scopes = ['openid', 'offline_access', 'Files.ReadWrite.All'];
class ExcelOnlineOAuth2 {
    constructor() {
        this.label = 'Excel Online OAuth2';
        this.name = 'excelOnlineOAuth2';
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
module.exports = { credClass: ExcelOnlineOAuth2 };
//# sourceMappingURL=ExcelOnlineOAuth2.credential.js.map