"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CloudflareApi {
    constructor() {
        this.label = 'Cloudflare API';
        this.name = 'cloudflareApi';
        this.version = 1.0;
        this.description = 'Use your Cloudflare Account ID and API Token';
        this.inputs = [
            {
                label: 'Cloudflare Account ID',
                name: 'cloudflareAccountId',
                type: 'string'
            },
            {
                label: 'Cloudflare API Token',
                name: 'cloudflareApiToken',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: CloudflareApi };
//# sourceMappingURL=CloudflareApi.credential.js.map