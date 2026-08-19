"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NvidiaNIMApi {
    constructor() {
        this.label = 'NVIDIA NGC API Key';
        this.name = 'nvidiaNIMApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'NVIDIA NGC API Key',
                name: 'nvidiaNIMApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: NvidiaNIMApi };
//# sourceMappingURL=NvdiaNIMApi.credential.js.map