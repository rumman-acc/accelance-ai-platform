"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WolframAlphaApp {
    constructor() {
        this.label = 'WolframAlpha App ID';
        this.name = 'wolframAlphaAppId';
        this.version = 1.0;
        this.description = 'Get an App Id from <a target="_blank" href="https://developer.wolframalpha.com">Wolfram Alpha Portal</a>';
        this.inputs = [
            {
                label: 'App ID',
                name: 'wolframAlphaAppId',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: WolframAlphaApp };
//# sourceMappingURL=WolframAlphaApp.credential.js.map