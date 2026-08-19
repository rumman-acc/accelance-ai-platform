"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ElevenLabsApi {
    constructor() {
        this.label = 'Eleven Labs API';
        this.name = 'elevenLabsApi';
        this.version = 1.0;
        this.description =
            'Sign up for a Eleven Labs account and <a target="_blank" href="https://elevenlabs.io/app/settings/api-keys">create an API Key</a>.';
        this.inputs = [
            {
                label: 'Eleven Labs API Key',
                name: 'elevenLabsApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: ElevenLabsApi };
//# sourceMappingURL=ElevenLabsApi.credential.js.map