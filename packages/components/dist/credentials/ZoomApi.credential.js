"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ZoomApi {
    constructor() {
        this.label = 'Zoom API';
        this.name = 'zoomApi';
        this.version = 1.0;
        this.description =
            'Create a Server-to-Server OAuth app in the <a target="_blank" href="https://marketplace.zoom.us/">Zoom App Marketplace</a> to obtain the Account ID, Client ID, and Client Secret';
        this.inputs = [
            {
                label: 'Account ID',
                name: 'accountId',
                type: 'string'
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
            }
        ];
    }
}
module.exports = { credClass: ZoomApi };
//# sourceMappingURL=ZoomApi.credential.js.map