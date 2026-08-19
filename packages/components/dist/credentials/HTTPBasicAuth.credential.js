"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HttpBasicAuthCredential {
    constructor() {
        this.label = 'HTTP Basic Auth';
        this.name = 'httpBasicAuth';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Basic Auth Username',
                name: 'basicAuthUsername',
                type: 'string'
            },
            {
                label: 'Basic Auth Password',
                name: 'basicAuthPassword',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: HttpBasicAuthCredential };
//# sourceMappingURL=HTTPBasicAuth.credential.js.map