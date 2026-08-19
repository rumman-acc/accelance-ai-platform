"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UpstashVectorApi {
    constructor() {
        this.label = 'Upstash Vector API';
        this.name = 'upstashVectorApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Upstash Vector REST URL',
                name: 'UPSTASH_VECTOR_REST_URL',
                type: 'url'
            },
            {
                label: 'Upstash Vector REST Token',
                name: 'UPSTASH_VECTOR_REST_TOKEN',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: UpstashVectorApi };
//# sourceMappingURL=UpstashVectorApi.credential.js.map