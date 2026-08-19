"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class E2BApi {
    constructor() {
        this.label = 'E2B API';
        this.name = 'E2BApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'E2B Api Key',
                name: 'e2bApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: E2BApi };
//# sourceMappingURL=E2B.credential.js.map