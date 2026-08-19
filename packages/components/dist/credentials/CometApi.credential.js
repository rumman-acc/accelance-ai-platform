"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CometApi {
    constructor() {
        this.label = 'Comet API';
        this.name = 'cometApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Comet API Key',
                name: 'cometApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: CometApi };
//# sourceMappingURL=CometApi.credential.js.map