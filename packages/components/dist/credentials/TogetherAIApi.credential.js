"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TogetherAIApi {
    constructor() {
        this.label = 'TogetherAI API';
        this.name = 'togetherAIApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'TogetherAI Api Key',
                name: 'togetherAIApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: TogetherAIApi };
//# sourceMappingURL=TogetherAIApi.credential.js.map