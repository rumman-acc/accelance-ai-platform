"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const exa_1 = require("@langchain/exa");
const exa_js_1 = __importDefault(require("exa-js"));
const utils_1 = require("../../../src/utils");
const DESC = `A wrapper around Exa Search. Input should be an Exa-optimized query. Output is a JSON array of the query results`;
class ExaSearch_Tools {
    constructor() {
        this.label = 'Exa Search';
        this.name = 'exaSearch';
        this.version = 1.1;
        this.type = 'ExaSearch';
        this.icon = 'exa.svg';
        this.category = 'Tools';
        this.description = 'Wrapper around Exa Search API - search engine fully designed for use by LLMs';
        this.inputs = [
            {
                label: 'Tool Description',
                name: 'description',
                type: 'string',
                description: 'Description of what the tool does. This is for LLM to determine when to use this tool.',
                rows: 4,
                additionalParams: true,
                default: DESC
            },
            {
                label: 'Num of Results',
                name: 'numResults',
                type: 'number',
                optional: true,
                step: 1,
                additionalParams: true,
                description: 'Number of search results to return. Default 10. Max 10 for basic plans. Up to thousands for custom plans.'
            },
            {
                label: 'Search Type',
                name: 'type',
                type: 'options',
                options: [
                    {
                        label: 'keyword',
                        name: 'keyword'
                    },
                    {
                        label: 'neural',
                        name: 'neural'
                    },
                    {
                        label: 'auto',
                        name: 'auto',
                        description: 'decides between keyword and neural'
                    }
                ],
                optional: true,
                additionalParams: true
            },
            {
                label: 'Use Auto Prompt',
                name: 'useAutoprompt',
                type: 'boolean',
                optional: true,
                additionalParams: true,
                description: 'If true, your query will be converted to a Exa query. Default false.'
            },
            {
                label: 'Category (Beta)',
                name: 'category',
                type: 'options',
                description: 'A data category to focus on, with higher comprehensivity and data cleanliness. Categories right now include company, research paper, news, github, tweet, movie, song, personal site, and pdf',
                options: [
                    {
                        label: 'company',
                        name: 'company'
                    },
                    {
                        label: 'research paper',
                        name: 'research paper'
                    },
                    {
                        label: 'news',
                        name: 'news'
                    },
                    {
                        label: 'github',
                        name: 'github'
                    },
                    {
                        label: 'tweet',
                        name: 'tweet'
                    },
                    {
                        label: 'movie',
                        name: 'movie'
                    },
                    {
                        label: 'song',
                        name: 'song'
                    },
                    {
                        label: 'pdf',
                        name: 'pdf'
                    },
                    {
                        label: 'personal site',
                        name: 'personal site'
                    },
                    {
                        label: 'linkedin profile',
                        name: 'linkedin profile'
                    },
                    {
                        label: 'financial report',
                        name: 'financial report'
                    }
                ],
                optional: true,
                additionalParams: true
            },
            {
                label: 'Include Domains',
                name: 'includeDomains',
                type: 'string',
                rows: 4,
                optional: true,
                additionalParams: true,
                description: 'List of domains to include in the search, separated by comma. If specified, results will only come from these domains.'
            },
            {
                label: 'Exclude Domains',
                name: 'excludeDomains',
                type: 'string',
                rows: 4,
                optional: true,
                additionalParams: true,
                description: 'List of domains to exclude in the search, separated by comma. If specified, results will not include any from these domains.'
            },
            {
                label: 'Start Crawl Date',
                name: 'startCrawlDate',
                type: 'string',
                optional: true,
                additionalParams: true,
                placeholder: '2023-01-01T00:00:00.000Z',
                description: 'Crawl date refers to the date that Exa discovered a link. Results will include links that were crawled after this date. Must be specified in ISO 8601 format.'
            },
            {
                label: 'End Crawl Date',
                name: 'endCrawlDate',
                type: 'string',
                optional: true,
                additionalParams: true,
                placeholder: '2023-12-31T00:00:00.000Z',
                description: 'Crawl date refers to the date that Exa discovered a link. Results will include links that were crawled before this date. Must be specified in ISO 8601 format.'
            },
            {
                label: 'Start Published Date',
                name: 'startPublishedDate',
                type: 'string',
                optional: true,
                additionalParams: true,
                placeholder: '2023-01-01T00:00:00.000Z',
                description: 'Only links with a published date after this will be returned. Must be specified in ISO 8601 format.'
            },
            {
                label: 'End Published Date',
                name: 'endPublishedDate',
                type: 'string',
                optional: true,
                additionalParams: true,
                placeholder: '2023-12-31T00:00:00.000Z',
                description: 'Only links with a published date before this will be returned. Must be specified in ISO 8601 format.'
            }
        ];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['exaSearchApi']
        };
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(exa_1.ExaSearchResults)];
    }
    async init(nodeData, _, options) {
        const description = nodeData.inputs?.description;
        const numResults = nodeData.inputs?.numResults;
        const type = nodeData.inputs?.type;
        const useAutoprompt = nodeData.inputs?.useAutoprompt;
        const category = nodeData.inputs?.category;
        const includeDomains = nodeData.inputs?.includeDomains;
        const excludeDomains = nodeData.inputs?.excludeDomains;
        const startCrawlDate = nodeData.inputs?.startCrawlDate;
        const endCrawlDate = nodeData.inputs?.endCrawlDate;
        const startPublishedDate = nodeData.inputs?.startPublishedDate;
        const endPublishedDate = nodeData.inputs?.endPublishedDate;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const exaSearchApiKey = (0, utils_1.getCredentialParam)('exaSearchApiKey', credentialData, nodeData);
        const tool = new exa_1.ExaSearchResults({
            client: new exa_js_1.default(exaSearchApiKey),
            searchArgs: {
                numResults: numResults ? parseFloat(numResults) : undefined,
                type: type || undefined,
                useAutoprompt: useAutoprompt || undefined,
                category: category || undefined,
                includeDomains: includeDomains ? includeDomains.split(',') : undefined,
                excludeDomains: excludeDomains ? excludeDomains.split(',') : undefined,
                startCrawlDate: startCrawlDate || undefined,
                endCrawlDate: endCrawlDate || undefined,
                startPublishedDate: startPublishedDate || undefined,
                endPublishedDate: endPublishedDate || undefined
            }
        });
        if (description)
            tool.description = description;
        return tool;
    }
}
module.exports = { nodeClass: ExaSearch_Tools };
//# sourceMappingURL=ExaSearch.js.map