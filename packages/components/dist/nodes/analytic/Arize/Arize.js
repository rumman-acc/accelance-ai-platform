"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Arize_Analytic {
    constructor() {
        this.label = 'Arize';
        this.name = 'arize';
        this.version = 1.0;
        this.type = 'Arize';
        this.icon = 'arize.png';
        this.category = 'Analytic';
        this.baseClasses = [this.type];
        this.inputs = [];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['arizeApi']
        };
    }
}
module.exports = { nodeClass: Arize_Analytic };
//# sourceMappingURL=Arize.js.map