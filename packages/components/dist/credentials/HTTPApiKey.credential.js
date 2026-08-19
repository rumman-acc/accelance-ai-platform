"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HTTPApiKeyCredential {
    constructor() {
        this.label = 'HTTP Api Key';
        this.name = 'httpApiKey';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Key',
                name: 'key',
                type: 'string'
            },
            {
                label: 'Value',
                name: 'value',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: HTTPApiKeyCredential };
//# sourceMappingURL=HTTPApiKey.credential.js.map