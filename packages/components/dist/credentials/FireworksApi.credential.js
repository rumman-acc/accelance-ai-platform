"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FireworksApi {
    constructor() {
        this.label = 'Fireworks API';
        this.name = 'fireworksApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Fireworks Api Key',
                name: 'fireworksApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: FireworksApi };
//# sourceMappingURL=FireworksApi.credential.js.map