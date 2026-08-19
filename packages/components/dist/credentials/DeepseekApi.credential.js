"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DeepseekApi {
    constructor() {
        this.label = 'DeepseekAI API';
        this.name = 'deepseekApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'DeepseekAI API Key',
                name: 'deepseekApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: DeepseekApi };
//# sourceMappingURL=DeepseekApi.credential.js.map