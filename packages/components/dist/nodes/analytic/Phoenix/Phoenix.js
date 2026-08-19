"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Phoenix_Analytic {
    constructor() {
        this.label = 'Phoenix';
        this.name = 'phoenix';
        this.version = 1.0;
        this.type = 'Phoenix';
        this.icon = 'phoenix.png';
        this.category = 'Analytic';
        this.baseClasses = [this.type];
        this.inputs = [];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['phoenixApi']
        };
    }
}
module.exports = { nodeClass: Phoenix_Analytic };
//# sourceMappingURL=Phoenix.js.map