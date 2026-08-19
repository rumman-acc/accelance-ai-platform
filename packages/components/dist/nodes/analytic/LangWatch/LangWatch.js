"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LangWatch_Analytic {
    constructor() {
        this.label = 'LangWatch';
        this.name = 'LangWatch';
        this.version = 1.0;
        this.type = 'LangWatch';
        this.icon = 'LangWatch.svg';
        this.category = 'Analytic';
        this.baseClasses = [this.type];
        this.inputs = [];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['langwatchApi']
        };
    }
}
module.exports = { nodeClass: LangWatch_Analytic };
//# sourceMappingURL=LangWatch.js.map