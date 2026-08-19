"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FireCrawlApiCredential {
    constructor() {
        this.label = 'FireCrawl API';
        this.name = 'fireCrawlApi';
        this.version = 2.0;
        this.description =
            'You can find the FireCrawl API token on your <a target="_blank" href="https://www.firecrawl.dev/">FireCrawl account</a> page.';
        this.inputs = [
            {
                label: 'FireCrawl API',
                name: 'firecrawlApiToken',
                type: 'password'
            },
            {
                label: 'FireCrawl API URL',
                name: 'firecrawlApiUrl',
                type: 'string',
                default: 'https://api.firecrawl.dev'
            }
        ];
    }
}
module.exports = { credClass: FireCrawlApiCredential };
//# sourceMappingURL=FireCrawlApi.credential.js.map