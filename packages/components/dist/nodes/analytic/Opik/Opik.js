"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Opik_Analytic {
    constructor() {
        this.label = 'Opik';
        this.name = 'opik';
        this.version = 1.0;
        this.type = 'Opik';
        this.icon = 'opik.png';
        this.category = 'Analytic';
        this.baseClasses = [this.type];
        this.inputs = [];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['opikApi']
        };
    }
}
module.exports = { nodeClass: Opik_Analytic };
//# sourceMappingURL=Opik.js.map