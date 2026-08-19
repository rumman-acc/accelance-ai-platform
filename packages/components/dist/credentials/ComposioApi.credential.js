"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ComposioApi {
    constructor() {
        this.label = 'Composio API';
        this.name = 'composioApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Composio API Key',
                name: 'composioApi',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: ComposioApi };
//# sourceMappingURL=ComposioApi.credential.js.map