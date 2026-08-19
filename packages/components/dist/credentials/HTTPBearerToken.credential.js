"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HTTPBearerTokenCredential {
    constructor() {
        this.label = 'HTTP Bearer Token';
        this.name = 'httpBearerToken';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Token',
                name: 'token',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: HTTPBearerTokenCredential };
//# sourceMappingURL=HTTPBearerToken.credential.js.map