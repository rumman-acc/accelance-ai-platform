'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
// NOTE: Figma's Remote MCP Server (https://mcp.figma.com/mcp) documents OAuth as its only
// supported auth path for MCP clients. This credential uses Figma's standard, long-standing
// OAuth2 app flow (same one used for the regular Figma REST API) to obtain that token — Figma
// does not publish a separate token flow specific to MCP. This has not been verified against a
// live Figma MCP session; if Figma's MCP endpoint rejects a REST-API-scoped token, this
// credential/node pair needs revisiting once a real Figma OAuth app is registered and tested.
class FigmaOAuth2 {
    constructor() {
        this.label = 'Figma OAuth2'
        this.name = 'figmaOAuth2'
        this.version = 1.0
        this.description =
            'Register an OAuth2 app at <a target="_blank" href="https://www.figma.com/developers/apps">Figma developer apps</a> to get a Client ID/Secret.'
        this.inputs = [
            {
                label: 'Authorization URL',
                name: 'authorizationUrl',
                type: 'string',
                default: 'https://www.figma.com/oauth'
            },
            {
                label: 'Access Token URL',
                name: 'accessTokenUrl',
                type: 'string',
                default: 'https://api.figma.com/v1/oauth/token'
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
                default: 'files:read'
            }
        ]
    }
}
module.exports = { credClass: FigmaOAuth2 }
//# sourceMappingURL=FigmaOAuth2.credential.js.map
