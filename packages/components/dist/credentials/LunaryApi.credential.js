"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LunaryApi {
    constructor() {
        this.label = 'Lunary AI';
        this.name = 'lunaryApi';
        this.version = 1.0;
        this.description =
            'Refer to the <a target="_blank" href="https://lunary.ai/docs?utm_source=flowise">official guide</a> to get a public key.';
        this.inputs = [
            {
                label: 'Public Key / Project ID',
                name: 'lunaryAppId',
                type: 'string',
                placeholder: '<Lunary_PROJECT_ID>'
            },
            {
                label: 'Endpoint',
                name: 'lunaryEndpoint',
                type: 'string',
                default: 'https://api.lunary.ai'
            }
        ];
    }
}
module.exports = { credClass: LunaryApi };
//# sourceMappingURL=LunaryApi.credential.js.map