"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class OxylabsApiCredential {
    constructor() {
        this.label = 'Oxylabs API';
        this.name = 'oxylabsApi';
        this.version = 1.0;
        this.description = 'Oxylabs API credentials description, to add more info';
        this.inputs = [
            {
                label: 'Oxylabs Username',
                name: 'username',
                type: 'string'
            },
            {
                label: 'Oxylabs Password',
                name: 'password',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: OxylabsApiCredential };
//# sourceMappingURL=OxylabsApi.credential.js.map