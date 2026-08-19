"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = require("@langchain/core/tools");
const utils_1 = require("../../../src/utils");
const httpSecurity_1 = require("../../../src/httpSecurity");
const defaultDesc = 'A meta search engine. Useful for when you need to answer questions about current events. Input should be a search query. Output is a JSON array of the query results';
const defaultName = 'searxng-search';
class Searxng_Tools {
    constructor() {
        this.label = 'SearXNG';
        this.name = 'searXNG';
        this.version = 3.0;
        this.type = 'SearXNG';
        this.icon = 'SearXNG.svg';
        this.category = 'Tools';
        this.description = 'Wrapper around SearXNG - a free internet metasearch engine';
        this.inputs = [
            {
                label: 'Base URL',
                name: 'apiBase',
                type: 'string',
                default: 'http://localhost:8080'
            },
            {
                label: 'Tool Name',
                name: 'toolName',
                type: 'string',
                default: defaultName
            },
            {
                label: 'Tool Description',
                name: 'toolDescription',
                type: 'string',
                rows: 4,
                default: defaultDesc
            },
            {
                label: 'Headers',
                name: 'headers',
                type: 'json',
                description: 'Custom headers for the request',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Format',
                name: 'format',
                type: 'options',
                options: [
                    {
                        label: 'JSON',
                        name: 'json'
                    },
                    {
                        label: 'HTML',
                        name: 'html'
                    }
                ],
                default: 'json',
                description: 'Format of the response. You need to enable search formats in settings.yml. Refer to <a target="_blank" href="https://docs.flowiseai.com/integrations/langchain/tools/searxng">SearXNG Setup Guide</a> for more details.',
                additionalParams: true
            },
            {
                label: 'Categories',
                name: 'categories',
                description: 'Comma separated list, specifies the active search categories. (see <a target="_blank" href="https://docs.searxng.org/user/configured_engines.html#configured-engines">Configured Engines</a>)',
                optional: true,
                additionalParams: true,
                type: 'string'
            },
            {
                label: 'Engines',
                name: 'engines',
                description: 'Comma separated list, specifies the active search engines. (see <a target="_blank" href="https://docs.searxng.org/user/configured_engines.html#configured-engines">Configured Engines</a>)',
                optional: true,
                additionalParams: true,
                type: 'string'
            },
            {
                label: 'Language',
                name: 'language',
                description: 'Code of the language.',
                optional: true,
                additionalParams: true,
                type: 'string'
            },
            {
                label: 'Page No.',
                name: 'pageno',
                description: 'Search page number.',
                optional: true,
                additionalParams: true,
                type: 'number'
            },
            {
                label: 'Time Range',
                name: 'time_range',
                description: 'Time range of search for engines which support it. See if an engine supports time range search in the preferences page of an instance.',
                optional: true,
                additionalParams: true,
                type: 'string'
            },
            {
                label: 'Safe Search',
                name: 'safesearch',
                description: 'Filter search results of engines which support safe search. See if an engine supports safe search in the preferences page of an instance.',
                optional: true,
                additionalParams: true,
                type: 'number'
            }
        ];
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(SearxngSearch)];
    }
    async init(nodeData, _) {
        const apiBase = nodeData.inputs?.apiBase;
        const headers = nodeData.inputs?.headers;
        const categories = nodeData.inputs?.categories;
        const engines = nodeData.inputs?.engines;
        const language = nodeData.inputs?.language;
        const pageno = nodeData.inputs?.pageno;
        const time_range = nodeData.inputs?.time_range;
        const safesearch = nodeData.inputs?.safesearch;
        const format = nodeData.inputs?.format;
        const toolName = nodeData.inputs?.toolName;
        const toolDescription = nodeData.inputs?.toolDescription;
        const params = {};
        if (categories)
            params.categories = categories;
        if (engines)
            params.engines = engines;
        if (language)
            params.language = language;
        if (pageno)
            params.pageNumber = parseFloat(pageno);
        if (time_range)
            params.timeRange = parseFloat(time_range);
        if (safesearch)
            params.safesearch = safesearch;
        if (format)
            params.format = format;
        let customHeaders = undefined;
        if (headers) {
            customHeaders = typeof headers === 'string' ? JSON.parse(headers) : headers;
        }
        const tool = new SearxngSearch({
            apiBase,
            params,
            headers: customHeaders,
            toolName,
            toolDescription
        });
        return tool;
    }
}
class SearxngSearch extends tools_1.Tool {
    static lc_name() {
        return 'SearxngSearch';
    }
    get lc_secrets() {
        return {
            apiBase: 'SEARXNG_API_BASE'
        };
    }
    constructor({ apiBase, params, headers, toolName, toolDescription }) {
        super(...arguments);
        this.name = defaultName;
        this.description = defaultDesc;
        this.params = {
            numResults: 10,
            pageNumber: 1,
            imageProxy: true,
            safesearch: 0
        };
        this.apiBase = apiBase;
        this.headers = { 'content-type': 'application/json', ...headers };
        if (!this.apiBase) {
            throw new Error(`SEARXNG_API_BASE not set. You can set it as "SEARXNG_API_BASE" in your environment variables.`);
        }
        if (params) {
            this.params = { ...this.params, ...params };
        }
        if (toolName) {
            this.name = toolName;
        }
        if (toolDescription) {
            this.description = toolDescription;
        }
    }
    buildUrl(path, parameters, baseUrl) {
        const nonUndefinedParams = Object.entries(parameters)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, value.toString()]); // Avoid string conversion
        const searchParams = new URLSearchParams(nonUndefinedParams);
        return `${baseUrl}/${path}?${searchParams}`;
    }
    async _call(input) {
        const queryParams = {
            q: input,
            ...this.params
        };
        const url = this.buildUrl('search', queryParams, this.apiBase);
        const resp = await (0, httpSecurity_1.secureFetch)(url, {
            method: 'POST',
            headers: this.headers,
            signal: AbortSignal.timeout(5 * 1000) // node-fetch AbortSignal type predates native AbortSignal
        });
        if (!resp.ok) {
            throw new Error(resp.statusText);
        }
        const res = await resp.json();
        if (!res.results.length && !res.answers.length && !res.infoboxes.length && !res.suggestions.length) {
            return 'No good results found.';
        }
        else if (res.results.length) {
            const response = [];
            res.results.forEach((r) => {
                response.push(JSON.stringify({
                    title: r.title || '',
                    link: r.url || '',
                    snippet: r.content || ''
                }));
            });
            return response.slice(0, this.params?.numResults).toString();
        }
        else if (res.answers.length) {
            return res.answers[0];
        }
        else if (res.infoboxes.length) {
            return res.infoboxes[0]?.content ?? '';
        }
        else if (res.suggestions.length) {
            let suggestions = 'Suggestions: ';
            res.suggestions.forEach((s) => {
                suggestions += `${s}, `;
            });
            return suggestions;
        }
        else {
            return 'No good results found.';
        }
    }
}
module.exports = { nodeClass: Searxng_Tools };
//# sourceMappingURL=Searxng.js.map