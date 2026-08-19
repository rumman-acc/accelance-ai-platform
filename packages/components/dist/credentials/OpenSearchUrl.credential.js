'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
class OpenSearchUrl {
    constructor() {
        this.label = 'OpenSearch'
        this.name = 'openSearchUrl'
        this.version = 2.0
        this.inputs = [
            {
                label: 'OpenSearch Url',
                name: 'openSearchUrl',
                type: 'url'
            },
            {
                label: 'User',
                name: 'user',
                type: 'string',
                placeholder: '<OPENSEARCH_USERNAME>',
                optional: true
            },
            {
                label: 'Password',
                name: 'password',
                type: 'password',
                placeholder: '<OPENSEARCH_PASSWORD>',
                optional: true
            }
        ]
    }
}
module.exports = { credClass: OpenSearchUrl }
//# sourceMappingURL=OpenSearchUrl.credential.js.map
