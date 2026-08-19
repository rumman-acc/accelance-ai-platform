'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
class OllamaApi {
    constructor() {
        this.label = 'Ollama API'
        this.name = 'ollamaApi'
        this.version = 1.0
        this.inputs = [
            {
                label: 'Ollama Api Key',
                name: 'ollamaApiKey',
                type: 'password'
            }
        ]
    }
}
module.exports = { credClass: OllamaApi }
//# sourceMappingURL=Ollama.credential.js.map
