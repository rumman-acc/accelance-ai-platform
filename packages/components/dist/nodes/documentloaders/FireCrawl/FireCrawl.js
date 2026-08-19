"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FireCrawlLoader = void 0;
const documents_1 = require("@langchain/core/documents");
const base_1 = require("@langchain/classic/document_loaders/base");
const utils_1 = require("../../../src/utils");
const httpSecurity_1 = require("../../../src/httpSecurity");
// FirecrawlApp class (not exported)
class FirecrawlApp {
    constructor({ apiKey = null, apiUrl = null }) {
        this.apiKey = apiKey || '';
        this.apiUrl = apiUrl || 'https://api.firecrawl.dev';
        if (!this.apiKey) {
            throw new Error('No API key provided');
        }
    }
    async scrapeUrl(url, params = null) {
        const headers = this.prepareHeaders();
        // Create a clean payload with only valid parameters
        const validParams = {
            url,
            formats: ['markdown'],
            onlyMainContent: true
        };
        // Add optional parameters if they exist
        if (params?.scrapeOptions) {
            if (params.scrapeOptions.includeTags) {
                validParams.includeTags = Array.isArray(params.scrapeOptions.includeTags)
                    ? params.scrapeOptions.includeTags
                    : params.scrapeOptions.includeTags.split(',');
            }
            if (params.scrapeOptions.excludeTags) {
                validParams.excludeTags = Array.isArray(params.scrapeOptions.excludeTags)
                    ? params.scrapeOptions.excludeTags
                    : params.scrapeOptions.excludeTags.split(',');
            }
            if (params.scrapeOptions.mobile !== undefined) {
                validParams.mobile = params.scrapeOptions.mobile;
            }
            if (params.scrapeOptions.skipTlsVerification !== undefined) {
                validParams.skipTlsVerification = params.scrapeOptions.skipTlsVerification;
            }
            if (params.scrapeOptions.timeout) {
                validParams.timeout = params.scrapeOptions.timeout;
            }
        }
        // Add JSON options if they exist
        if (params?.extractorOptions) {
            validParams.jsonOptions = {
                schema: params.extractorOptions.extractionSchema,
                prompt: params.extractorOptions.extractionPrompt
            };
        }
        try {
            const parameters = {
                ...validParams,
                integration: 'flowise'
            };
            const response = await this.postRequest(this.apiUrl + '/v1/scrape', parameters, headers);
            if (response.status === 200) {
                const responseData = response.data;
                if (responseData.success) {
                    return responseData;
                }
                else {
                    throw new Error(`Failed to scrape URL. Error: ${responseData.error}`);
                }
            }
            else {
                this.handleError(response, 'scrape URL');
            }
        }
        catch (error) {
            throw new Error(error.message);
        }
        return { success: false, error: 'Internal server error.' };
    }
    async crawlUrl(url, params = null, waitUntilDone = true, pollInterval = 2, idempotencyKey) {
        const headers = this.prepareHeaders(idempotencyKey);
        // Create a clean payload with only valid parameters
        const validParams = {
            url
        };
        // Add scrape options with only non-empty values
        const scrapeOptions = {
            formats: ['markdown'],
            onlyMainContent: true
        };
        // Add crawl-specific parameters if they exist and are not empty
        if (params) {
            const validCrawlParams = [
                'excludePaths',
                'includePaths',
                'maxDepth',
                'maxDiscoveryDepth',
                'ignoreSitemap',
                'ignoreQueryParameters',
                'limit',
                'allowBackwardLinks',
                'allowExternalLinks',
                'delay'
            ];
            validCrawlParams.forEach((param) => {
                if (params[param] !== undefined && params[param] !== null && params[param] !== '') {
                    validParams[param] = params[param];
                }
            });
        }
        // Add scrape options if they exist and are not empty
        if (params?.scrapeOptions) {
            if (params.scrapeOptions.includePaths) {
                const includePaths = Array.isArray(params.scrapeOptions.includePaths)
                    ? params.scrapeOptions.includePaths
                    : params.scrapeOptions.includePaths.split(',');
                if (includePaths.length > 0) {
                    validParams.includePaths = includePaths;
                }
            }
            if (params.scrapeOptions.excludePaths) {
                const excludePaths = Array.isArray(params.scrapeOptions.excludePaths)
                    ? params.scrapeOptions.excludePaths
                    : params.scrapeOptions.excludePaths.split(',');
                if (excludePaths.length > 0) {
                    validParams.excludePaths = excludePaths;
                }
            }
            if (params.scrapeOptions.limit) {
                validParams.limit = params.scrapeOptions.limit;
            }
            const validScrapeParams = ['mobile', 'skipTlsVerification', 'timeout', 'includeTags', 'excludeTags', 'onlyMainContent'];
            validScrapeParams.forEach((param) => {
                if (params.scrapeOptions[param] !== undefined && params.scrapeOptions[param] !== null) {
                    scrapeOptions[param] = params.scrapeOptions[param];
                }
            });
        }
        // Only add scrapeOptions if it has more than just the default values
        if (Object.keys(scrapeOptions).length > 2) {
            validParams.scrapeOptions = scrapeOptions;
        }
        try {
            const parameters = {
                ...validParams,
                integration: 'flowise'
            };
            const response = await this.postRequest(this.apiUrl + '/v1/crawl', parameters, headers);
            if (response.status === 200) {
                const crawlResponse = response.data;
                if (!crawlResponse.success) {
                    throw new Error(`Crawl request failed: ${crawlResponse.error || 'Unknown error'}`);
                }
                if (waitUntilDone) {
                    return this.monitorJobStatus(crawlResponse.id, headers, pollInterval);
                }
                else {
                    return crawlResponse;
                }
            }
            else {
                this.handleError(response, 'start crawl job');
            }
        }
        catch (error) {
            if (error.response?.data?.error) {
                throw new Error(`Crawl failed: ${error.response.data.error}`);
            }
            throw new Error(`Crawl failed: ${error.message}`);
        }
        return { success: false, id: '', url: '' };
    }
    async extract(request, waitUntilDone = true, pollInterval = 2) {
        const headers = this.prepareHeaders();
        // Create a clean payload with only valid parameters
        const validParams = {
            urls: request.urls
        };
        // Add optional parameters if they exist and are not empty
        if (request.prompt) {
            validParams.prompt = request.prompt;
        }
        if (request.schema) {
            validParams.schema = request.schema;
        }
        const validExtractParams = ['enableWebSearch', 'ignoreSitemap', 'includeSubdomains', 'showSources'];
        validExtractParams.forEach((param) => {
            if (request[param] !== undefined && request[param] !== null) {
                validParams[param] = request[param];
            }
        });
        // Add scrape options if they exist
        if (request.scrapeOptions) {
            const scrapeOptions = {
                formats: ['markdown'],
                onlyMainContent: true
            };
            // Handle includeTags
            if (request.scrapeOptions.includeTags) {
                const includeTags = Array.isArray(request.scrapeOptions.includeTags)
                    ? request.scrapeOptions.includeTags
                    : request.scrapeOptions.includeTags.split(',');
                if (includeTags.length > 0) {
                    scrapeOptions.includeTags = includeTags;
                }
            }
            // Handle excludeTags
            if (request.scrapeOptions.excludeTags) {
                const excludeTags = Array.isArray(request.scrapeOptions.excludeTags)
                    ? request.scrapeOptions.excludeTags
                    : request.scrapeOptions.excludeTags.split(',');
                if (excludeTags.length > 0) {
                    scrapeOptions.excludeTags = excludeTags;
                }
            }
            // Add other scrape options if they exist and are not empty
            const validScrapeParams = ['mobile', 'skipTlsVerification', 'timeout'];
            validScrapeParams.forEach((param) => {
                if (request.scrapeOptions?.[param] !== undefined && request.scrapeOptions?.[param] !== null) {
                    scrapeOptions[param] = request.scrapeOptions[param];
                }
            });
            // Add JSON options if they exist
            if (request.scrapeOptions.jsonOptions) {
                scrapeOptions.jsonOptions = {};
                if (request.scrapeOptions.jsonOptions.schema) {
                    scrapeOptions.jsonOptions.schema = request.scrapeOptions.jsonOptions.schema;
                }
                if (request.scrapeOptions.jsonOptions.prompt) {
                    scrapeOptions.jsonOptions.prompt = request.scrapeOptions.jsonOptions.prompt;
                }
            }
            // Only add scrapeOptions if it has more than just the default values
            if (Object.keys(scrapeOptions).length > 2) {
                validParams.scrapeOptions = scrapeOptions;
            }
        }
        try {
            const parameters = {
                ...validParams,
                integration: 'flowise'
            };
            const response = await this.postRequest(this.apiUrl + '/v1/extract', parameters, headers);
            if (response.status === 200) {
                const extractResponse = response.data;
                if (waitUntilDone) {
                    return this.monitorExtractStatus(extractResponse.id, headers, pollInterval);
                }
                else {
                    return extractResponse;
                }
            }
            else {
                this.handleError(response, 'start extract job');
            }
        }
        catch (error) {
            throw new Error(error.message);
        }
        return { success: false, id: '', url: '' };
    }
    async search(request) {
        const headers = this.prepareHeaders();
        // Create a clean payload with only valid parameters
        const validParams = {
            query: request.query
        };
        // Add optional parameters if they exist and are not empty
        const validSearchParams = ['limit', 'tbs', 'lang', 'country', 'location', 'timeout', 'ignoreInvalidURLs'];
        validSearchParams.forEach((param) => {
            if (request[param] !== undefined && request[param] !== null) {
                validParams[param] = request[param];
            }
        });
        try {
            const parameters = {
                ...validParams,
                integration: 'flowise'
            };
            const response = await this.postRequest(this.apiUrl + '/v1/search', parameters, headers);
            if (response.status === 200) {
                const searchResponse = response.data;
                if (!searchResponse.success) {
                    throw new Error(`Search request failed: ${searchResponse.warning || 'Unknown error'}`);
                }
                return searchResponse;
            }
            else {
                this.handleError(response, 'perform search');
            }
        }
        catch (error) {
            throw new Error(error.message);
        }
        return { success: false };
    }
    prepareHeaders(idempotencyKey) {
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            ...(idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {})
        };
    }
    async postRequest(url, data, headers) {
        const result = await (0, httpSecurity_1.secureAxiosRequest)({ method: 'POST', url, data, headers });
        return result;
    }
    getRequest(url, headers) {
        return (0, httpSecurity_1.secureAxiosRequest)({ method: 'GET', url, headers });
    }
    async monitorJobStatus(jobId, headers, checkInterval) {
        let isJobCompleted = false;
        while (!isJobCompleted) {
            const statusResponse = await this.getRequest(this.apiUrl + `/v1/crawl/${jobId}`, headers);
            if (statusResponse.status === 200) {
                const statusData = statusResponse.data;
                switch (statusData.status) {
                    case 'completed':
                        isJobCompleted = true;
                        return statusData;
                    case 'scraping':
                    case 'failed':
                        if (statusData.status === 'failed') {
                            throw new Error('Crawl job failed');
                        }
                        await new Promise((resolve) => setTimeout(resolve, Math.max(checkInterval, 2) * 1000));
                        break;
                    default:
                        throw new Error(`Unknown crawl status: ${statusData.status}`);
                }
            }
            else {
                this.handleError(statusResponse, 'check crawl status');
            }
        }
        throw new Error('Failed to monitor job status');
    }
    async monitorExtractStatus(jobId, headers, checkInterval) {
        let isJobCompleted = false;
        while (!isJobCompleted) {
            const statusResponse = await this.getRequest(this.apiUrl + `/v1/extract/${jobId}`, headers);
            if (statusResponse.status === 200) {
                const statusData = statusResponse.data;
                switch (statusData.status) {
                    case 'completed':
                        isJobCompleted = true;
                        return statusData;
                    case 'processing':
                    case 'failed':
                        if (statusData.status === 'failed') {
                            throw new Error('Extract job failed');
                        }
                        await new Promise((resolve) => setTimeout(resolve, Math.max(checkInterval, 2) * 1000));
                        break;
                    default:
                        throw new Error(`Unknown extract status: ${statusData.status}`);
                }
            }
            else {
                this.handleError(statusResponse, 'check extract status');
            }
        }
        throw new Error('Failed to monitor extract status');
    }
    handleError(response, action) {
        if ([402, 408, 409, 500].includes(response.status)) {
            const errorMessage = response.data.error || 'Unknown error occurred';
            throw new Error(`Failed to ${action}. Status code: ${response.status}. Error: ${errorMessage}`);
        }
        else {
            throw new Error(`Unexpected error occurred while trying to ${action}. Status code: ${response.status}`);
        }
    }
}
class FireCrawlLoader extends base_1.BaseDocumentLoader {
    constructor(loaderParams) {
        super();
        const { apiKey, apiUrl, url, query, mode = 'crawl', params } = loaderParams;
        if (!apiKey) {
            throw new Error('Firecrawl API key not set. You can set it as FIRECRAWL_API_KEY in your .env file, or pass it to Firecrawl.');
        }
        this.apiKey = apiKey;
        this.url = url;
        this.query = query;
        this.mode = mode;
        this.params = params;
        this.apiUrl = apiUrl || 'https://api.firecrawl.dev';
    }
    async load() {
        const app = new FirecrawlApp({ apiKey: this.apiKey, apiUrl: this.apiUrl });
        let firecrawlDocs;
        if (this.mode === 'search') {
            if (!this.query) {
                throw new Error('Firecrawl: Query is required for search mode');
            }
            const response = await app.search({ query: this.query, ...this.params });
            if (!response.success) {
                throw new Error(`Firecrawl: Failed to search. Warning: ${response.warning}`);
            }
            // Convert search results to FirecrawlDocument format
            firecrawlDocs = (response.data || []).map((result) => ({
                markdown: result.description,
                metadata: {
                    title: result.title,
                    sourceURL: result.url,
                    description: result.description
                }
            }));
        }
        else if (this.mode === 'scrape') {
            if (!this.url) {
                throw new Error('Firecrawl: URL is required for scrape mode');
            }
            const response = await app.scrapeUrl(this.url, this.params);
            if (!response.success) {
                throw new Error(`Firecrawl: Failed to scrape URL. Error: ${response.error}`);
            }
            firecrawlDocs = [response.data];
        }
        else if (this.mode === 'crawl') {
            if (!this.url) {
                throw new Error('Firecrawl: URL is required for crawl mode');
            }
            const response = await app.crawlUrl(this.url, this.params);
            if ('status' in response) {
                if (response.status === 'failed') {
                    throw new Error('Firecrawl: Crawl job failed');
                }
                firecrawlDocs = response.data || [];
            }
            else {
                if (!response.success) {
                    throw new Error(`Firecrawl: Failed to scrape URL. Error: ${response.error}`);
                }
                firecrawlDocs = [response.data];
            }
        }
        else if (this.mode === 'extract') {
            if (!this.url) {
                throw new Error('Firecrawl: URL is required for extract mode');
            }
            this.params.urls = [this.url];
            const response = await app.extract(this.params);
            if (!response.success) {
                throw new Error(`Firecrawl: Failed to extract URL.`);
            }
            // Convert extract response to document format
            if ('data' in response && response.data) {
                // Create a document from the extracted data
                const extractedData = response.data;
                const content = JSON.stringify(extractedData, null, 2);
                const metadata = {
                    source: this.url,
                    type: 'extracted_data'
                };
                // Add status and expiresAt if they exist in the response
                if ('status' in response) {
                    metadata.status = response.status;
                }
                if ('data' in response) {
                    metadata.data = response.data;
                }
                if ('expiresAt' in response) {
                    metadata.expiresAt = response.expiresAt;
                }
                return [
                    new documents_1.Document({
                        pageContent: content,
                        metadata
                    })
                ];
            }
            return [];
        }
        else {
            throw new Error(`Unrecognized mode '${this.mode}'. Expected one of 'crawl', 'scrape', 'extract', 'search'.`);
        }
        // Convert Firecrawl documents to LangChain documents
        const documents = firecrawlDocs.map((doc) => {
            // Use markdown content if available, otherwise fallback to HTML or empty string
            const content = doc.markdown || doc.html || doc.rawHtml || '';
            // Create a standard LangChain document
            return new documents_1.Document({
                pageContent: content,
                metadata: {
                    ...doc.metadata,
                    source: doc.metadata?.sourceURL || this.url,
                    title: doc.metadata?.title,
                    description: doc.metadata?.description,
                    language: doc.metadata?.language,
                    statusCode: doc.metadata?.statusCode
                }
            });
        });
        return documents;
    }
}
exports.FireCrawlLoader = FireCrawlLoader;
// Flowise Node Class
class FireCrawl_DocumentLoaders {
    constructor() {
        this.label = 'FireCrawl';
        this.name = 'fireCrawl';
        this.type = 'Document';
        this.icon = 'firecrawl.png';
        this.version = 4.0;
        this.category = 'Document Loaders';
        this.description = 'Load data from URL using FireCrawl';
        this.baseClasses = [this.type];
        this.credential = {
            label: 'FireCrawl API',
            name: 'credential',
            type: 'credential',
            credentialNames: ['fireCrawlApi']
        };
        this.inputs = [
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Type',
                type: 'options',
                name: 'crawlerType',
                options: [
                    {
                        label: 'Crawl',
                        name: 'crawl',
                        description: 'Crawl a URL and all accessible subpages'
                    },
                    {
                        label: 'Scrape',
                        name: 'scrape',
                        description: 'Scrape a URL and get its content'
                    },
                    {
                        label: 'Extract',
                        name: 'extract',
                        description: 'Extract data from a URL'
                    },
                    {
                        label: 'Search',
                        name: 'search',
                        description: 'Search the web using FireCrawl'
                    }
                ],
                default: 'crawl'
            },
            {
                label: 'URLs',
                name: 'url',
                type: 'string',
                description: 'URL to be crawled/scraped/extracted',
                placeholder: 'https://docs.flowiseai.com',
                optional: true,
                show: {
                    crawlerType: ['crawl', 'scrape', 'extract']
                }
            },
            {
                // includeTags
                label: 'Include Tags',
                name: 'includeTags',
                type: 'string',
                description: 'Tags to include in the output. Use comma to separate multiple tags.',
                optional: true,
                additionalParams: true,
                show: {
                    crawlerType: ['scrape']
                }
            },
            {
                // excludeTags
                label: 'Exclude Tags',
                name: 'excludeTags',
                type: 'string',
                description: 'Tags to exclude from the output. Use comma to separate multiple tags.',
                optional: true,
                additionalParams: true,
                show: {
                    crawlerType: ['scrape']
                }
            },
            {
                // onlyMainContent
                label: 'Only Main Content',
                name: 'onlyMainContent',
                type: 'boolean',
                description: 'Extract only the main content of the page',
                optional: true,
                additionalParams: true,
                show: {
                    crawlerType: ['scrape']
                }
            },
            {
                // limit
                label: 'Limit',
                name: 'limit',
                type: 'string',
                description: 'Maximum number of pages to crawl',
                optional: true,
                additionalParams: true,
                default: '10000',
                show: {
                    crawlerType: ['crawl']
                }
            },
            {
                label: 'Include Paths',
                name: 'includePaths',
                type: 'string',
                description: 'URL pathname regex patterns that include matching URLs in the crawl. Only the paths that match the specified patterns will be included in the response.',
                placeholder: `blog/.*, news/.*`,
                optional: true,
                additionalParams: true,
                show: {
                    crawlerType: ['crawl']
                }
            },
            {
                label: 'Exclude Paths',
                name: 'excludePaths',
                type: 'string',
                description: 'URL pathname regex patterns that exclude matching URLs from the crawl.',
                placeholder: `blog/.*, news/.*`,
                optional: true,
                additionalParams: true,
                show: {
                    crawlerType: ['crawl']
                }
            },
            {
                label: 'Schema',
                name: 'extractSchema',
                type: 'json',
                description: 'JSON schema for data extraction',
                optional: true,
                additionalParams: true,
                show: {
                    crawlerType: ['extract']
                }
            },
            {
                label: 'Prompt',
                name: 'extractPrompt',
                type: 'string',
                description: 'Prompt for data extraction',
                optional: true,
                additionalParams: true,
                show: {
                    crawlerType: ['extract']
                }
            },
            {
                label: 'Query',
                name: 'searchQuery',
                type: 'string',
                description: 'Search query to find relevant content',
                optional: true,
                show: {
                    crawlerType: ['search']
                }
            },
            {
                label: 'Limit',
                name: 'searchLimit',
                type: 'string',
                description: 'Maximum number of results to return',
                optional: true,
                additionalParams: true,
                default: '5',
                show: {
                    crawlerType: ['search']
                }
            },
            {
                label: 'Language',
                name: 'searchLang',
                type: 'string',
                description: 'Language code for search results (e.g., en, es, fr)',
                optional: true,
                additionalParams: true,
                default: 'en',
                show: {
                    crawlerType: ['search']
                }
            },
            {
                label: 'Country',
                name: 'searchCountry',
                type: 'string',
                description: 'Country code for search results (e.g., us, uk, ca)',
                optional: true,
                additionalParams: true,
                default: 'us',
                show: {
                    crawlerType: ['search']
                }
            },
            {
                label: 'Timeout',
                name: 'searchTimeout',
                type: 'number',
                description: 'Timeout in milliseconds for search operation',
                optional: true,
                additionalParams: true,
                default: 60000,
                show: {
                    crawlerType: ['search']
                }
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
        const textSplitter = nodeData.inputs?.textSplitter;
        const metadata = nodeData.inputs?.metadata;
        const url = nodeData.inputs?.url;
        const crawlerType = nodeData.inputs?.crawlerType;
        const limit = nodeData.inputs?.limit;
        const onlyMainContent = nodeData.inputs?.onlyMainContent;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const firecrawlApiToken = (0, utils_1.getCredentialParam)('firecrawlApiToken', credentialData, nodeData);
        const firecrawlApiUrl = (0, utils_1.getCredentialParam)('firecrawlApiUrl', credentialData, nodeData, 'https://api.firecrawl.dev');
        const output = nodeData.outputs?.output;
        // Validate URL only for non-search methods
        if (crawlerType !== 'search' && !url) {
            throw new Error('Firecrawl: URL is required for ' + crawlerType + ' mode');
        }
        const includePaths = nodeData.inputs?.includePaths ? nodeData.inputs.includePaths.split(',') : undefined;
        const excludePaths = nodeData.inputs?.excludePaths ? nodeData.inputs.excludePaths.split(',') : undefined;
        const includeTags = nodeData.inputs?.includeTags ? nodeData.inputs.includeTags.split(',') : undefined;
        const excludeTags = nodeData.inputs?.excludeTags ? nodeData.inputs.excludeTags.split(',') : undefined;
        const extractSchema = nodeData.inputs?.extractSchema;
        const extractPrompt = nodeData.inputs?.extractPrompt;
        const searchQuery = nodeData.inputs?.searchQuery;
        const searchLimit = nodeData.inputs?.searchLimit;
        const searchLang = nodeData.inputs?.searchLang;
        const searchCountry = nodeData.inputs?.searchCountry;
        const searchTimeout = nodeData.inputs?.searchTimeout;
        const input = {
            url,
            query: searchQuery,
            mode: crawlerType,
            apiKey: firecrawlApiToken,
            apiUrl: firecrawlApiUrl,
            params: {
                scrapeOptions: {
                    includePaths,
                    excludePaths,
                    limit: limit ? parseInt(limit, 10) : 1000,
                    includeTags,
                    excludeTags
                },
                schema: extractSchema || undefined,
                prompt: extractPrompt || undefined
            }
        };
        // Add search-specific parameters only when in search mode
        if (crawlerType === 'search') {
            if (!searchQuery) {
                throw new Error('Firecrawl: Search query is required for search mode');
            }
            input.params = {
                limit: searchLimit ? parseInt(searchLimit, 10) : 5,
                lang: searchLang,
                country: searchCountry,
                timeout: searchTimeout
            };
        }
        if (onlyMainContent === true) {
            const scrapeOptions = input.params?.scrapeOptions;
            input.params.scrapeOptions = {
                ...scrapeOptions,
                onlyMainContent: true
            };
        }
        const loader = new FireCrawlLoader(input);
        let docs = [];
        // Load documents
        docs = await loader.load();
        // Apply text splitting if configured
        if (textSplitter && docs.length > 0) {
            docs = await textSplitter.splitDocuments(docs);
        }
        // Apply metadata if provided
        if (metadata) {
            const parsedMetadata = typeof metadata === 'object' ? metadata : JSON.parse(metadata);
            docs = docs.map((doc) => ({
                ...doc,
                metadata: {
                    ...doc.metadata,
                    ...parsedMetadata
                }
            }));
        }
        // Return based on output type
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
module.exports = { nodeClass: FireCrawl_DocumentLoaders };
// FOR TESTING PURPOSES
// export { FireCrawl_DocumentLoaders }
//# sourceMappingURL=FireCrawl.js.map