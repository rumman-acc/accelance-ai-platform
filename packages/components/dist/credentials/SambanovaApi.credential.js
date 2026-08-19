"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SambanovaApi {
    constructor() {
        this.label = 'Sambanova API';
        this.name = 'sambanovaApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Sambanova Api Key',
                name: 'sambanovaApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: SambanovaApi };
//# sourceMappingURL=SambanovaApi.credential.js.map