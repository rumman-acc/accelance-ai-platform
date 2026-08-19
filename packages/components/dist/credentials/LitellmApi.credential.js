"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LitellmApi {
    constructor() {
        this.label = 'Litellm API';
        this.name = 'litellmApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'API Key',
                name: 'litellmApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: LitellmApi };
//# sourceMappingURL=LitellmApi.credential.js.map