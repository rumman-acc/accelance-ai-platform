"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MoonshotApi {
    constructor() {
        this.label = 'Moonshot AI API';
        this.name = 'moonshotApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Moonshot AI API Key',
                name: 'moonshotApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: MoonshotApi };
//# sourceMappingURL=MoonshotApi.credential.js.map