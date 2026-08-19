"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JinaAICredential {
    constructor() {
        this.label = 'JinaAI API';
        this.name = 'jinaAIApi';
        this.version = 1.0;
        this.description = 'You can get your API key from official <a target="_blank" href="https://jina.ai/">console</a> here.';
        this.inputs = [
            {
                label: 'JinaAI API Key',
                name: 'jinaAIAPIKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: JinaAICredential };
//# sourceMappingURL=JinaApi.credential.js.map