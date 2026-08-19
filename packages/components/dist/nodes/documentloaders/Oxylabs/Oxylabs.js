"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OxylabsLoader = void 0;
const base_1 = require("@langchain/classic/document_loaders/base");
const utils_1 = require("../../../src/utils");
const axios_1 = __importDefault(require("axios"));
class OxylabsLoader extends base_1.BaseDocumentLoader {
    constructor(loaderParams) {
        super();
        this.params = loaderParams;
    }
    async sendAPIRequest(params) {
        params = Object.fromEntries(Object.entries(params).filter(([_, value]) => value !== null && value !== '' && value !== undefined));
        const auth = Buffer.from(`${this.params.username}:${this.params.password}`).toString('base64');
        const response = await axios_1.default.post('https://realtime.oxylabs.io/v1/queries', params, {
            headers: {
                'Content-Type': 'application/json',
                'x-oxylabs-sdk': 'oxylabs-integration-flowise/1.0.0 (1.0.0; 64bit)',
                Authorization: `Basic ${auth}`
            }
        });
        if (response.status >= 400) {
            throw new Error(`Oxylabs: Failed to call Oxylabs API: ${response.status}`);
        }
        return response;
    }
    async load() {
        let isUrlSource = this.params.source == 'universal';
        const params = {
            source: this.params.source,
            geo_location: this.params.geo_location,
            render: this.params.render ? 'html' : null,
            parse: this.params.parse,
            user_agent_type: this.params.user_agent_type,
            markdown: !this.params.parse,
            url: isUrlSource ? this.params.query : null,
            query: !isUrlSource ? this.params.query : null
        };
        const response = await this.sendAPIRequest(params);
        const docs = response.data.results.map((result, index) => {
            const content = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
            return {
                id: `${response.data.job.id.toString()}-${index}`,
                pageContent: content,
                metadata: {}
            };
        });
        return docs;
    }
}
exports.OxylabsLoader = OxylabsLoader;
class Oxylabs_DocumentLoaders {
    constructor() {
        this.label = 'Oxylabs';
        this.name = 'oxylabs';
        this.type = 'Document';
        this.icon = 'oxylabs.svg';
        this.version = 1.0;
        this.category = 'Document Loaders';
        this.description = 'Extract data from URLs using Oxylabs';
        this.baseClasses = [this.type];
        this.credential = {
            label: 'Oxylabs API',
            name: 'credential',
            type: 'credential',
            credentialNames: ['oxylabsApi']
        };
        this.inputs = [
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: false
            },
            {
                label: 'Query',
                name: 'query',
                type: 'string',
                description: 'Website URL of query keyword.'
            },
            {
                label: 'Source',
                name: 'source',
                type: 'options',
                description: 'Target website to scrape.',
                options: [
                    {
                        label: 'Universal',
                        name: 'universal'
                    },
                    {
                        label: 'Google Search',
                        name: 'google_search'
                    },
                    {
                        label: 'Amazon Product',
                        name: 'amazon_product'
                    },
                    {
                        label: 'Amazon Search',
                        name: 'amazon_search'
                    }
                ],
                default: 'universal'
            },
            {
                label: 'Geolocation',
                name: 'geo_location',
                type: 'string',
                description: "Sets the proxy's geo location to retrieve data. Check Oxylabs documentation for more details.",
                optional: true
            },
            {
                label: 'Render',
                name: 'render',
                type: 'boolean',
                description: 'Enables JavaScript rendering when set to true.',
                optional: true,
                default: false
            },
            {
                label: 'Parse',
                name: 'parse',
                type: 'boolean',
                description: "Returns parsed data when set to true, as long as a dedicated parser exists for the submitted URL's page type.",
                optional: true,
                default: false
            },
            {
                label: 'User Agent Type',
                name: 'user_agent_type',
                type: 'options',
                description: 'Device type and browser.',
                options: [
                    {
                        label: 'Desktop',
                        name: 'desktop'
                    },
                    {
                        label: 'Desktop Chrome',
                        name: 'desktop_chrome'
                    },
                    {
                        label: 'Desktop Edge',
                        name: 'desktop_edge'
                    },
                    {
                        label: 'Desktop Firefox',
                        name: 'desktop_firefox'
                    },
                    {
                        label: 'Desktop Opera',
                        name: 'desktop_opera'
                    },
                    {
                        label: 'Desktop Safari',
                        name: 'desktop_safari'
                    },
                    {
                        label: 'Mobile',
                        name: 'mobile'
                    },
                    {
                        label: 'Mobile Android',
                        name: 'mobile_android'
                    },
                    {
                        label: 'Mobile iOS',
                        name: 'mobile_ios'
                    },
                    {
                        label: 'Tablet',
                        name: 'tablet'
                    },
                    {
                        label: 'Tablet Android',
                        name: 'tablet_android'
                    },
                    {
                        label: 'Tablet iOS',
                        name: 'tablet_ios'
                    }
                ],
                optional: true
            }
        ];
        this.outputs = [
            {
                label: 'Document',
                name: 'document',
                description: 'Array of document objects containing metadata and pageContent',
                baseClasses: [...this.baseClasses, 'json']
            },
            {
                label: 'Text',
                name: 'text',
                description: 'Concatenated string from pageContent of documents',
                baseClasses: ['string', 'json']
            }
        ];
    }
    async init(nodeData, _, options) {
        const query = nodeData.inputs?.query;
        const textSplitter = nodeData.inputs?.textSplitter;
        const source = nodeData.inputs?.source;
        const geo_location = nodeData.inputs?.geo_location;
        const render = nodeData.inputs?.render;
        const parse = nodeData.inputs?.parse;
        const user_agent_type = nodeData.inputs?.user_agent_type;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const username = (0, utils_1.getCredentialParam)('username', credentialData, nodeData);
        const password = (0, utils_1.getCredentialParam)('password', credentialData, nodeData);
        const output = nodeData.outputs?.output;
        const input = {
            username,
            password,
            query,
            source,
            geo_location,
            render,
            parse,
            user_agent_type
        };
        const loader = new OxylabsLoader(input);
        let docs = await loader.load();
        if (textSplitter && docs.length > 0) {
            docs = await textSplitter.splitDocuments(docs);
        }
        if (output === 'document') {
            return docs;
        }
        else {
            let finaltext = '';
            for (const doc of docs) {
                finaltext += `${doc.pageContent}\n`;
            }
            return (0, utils_1.handleEscapeCharacters)(finaltext, false);
        }
    }
}
module.exports = { nodeClass: Oxylabs_DocumentLoaders };
//# sourceMappingURL=Oxylabs.js.map