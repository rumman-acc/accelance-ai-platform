"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TavilyApi {
    constructor() {
        this.label = 'Tavily API';
        this.name = 'tavilyApi';
        this.version = 1.1;
        this.description = 'Tavily API is a search engine designed for LLMs and AI agents';
        this.inputs = [
            {
                label: 'Tavily Api Key',
                name: 'tavilyApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: TavilyApi };
//# sourceMappingURL=TavilyApi.credential.js.map