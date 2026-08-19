"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SpiderApiCredential {
    constructor() {
        this.label = 'Spider API';
        this.name = 'spiderApi';
        this.version = 1.0;
        this.description = 'Get your API key from the <a target="_blank" href="https://spider.cloud">Spider</a> dashboard.';
        this.inputs = [
            {
                label: 'Spider API Key',
                name: 'spiderApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: SpiderApiCredential };
//# sourceMappingURL=SpiderApi.credential.js.map