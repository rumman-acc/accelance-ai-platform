"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AgentflowApi {
    constructor() {
        this.label = 'Agentflow API';
        this.name = 'agentflowApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Agentflow Api Key',
                name: 'agentflowApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: AgentflowApi };
//# sourceMappingURL=AgentflowApi.credential.js.map