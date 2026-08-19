"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = require("@langchain/community/document_loaders/web/puppeteer");
const linkifyjs_1 = require("linkifyjs");
const lodash_1 = require("lodash");
const src_1 = require("../../../src");
class Puppeteer_DocumentLoaders {
    constructor() {
        this.label = 'Puppeteer Web Scraper';
        this.name = 'puppeteerWebScraper';
        this.version = 2.0;
        this.type = 'Document';
        this.icon = 'puppeteer.svg';
        this.category = 'Document Loaders';
        this.description = `Load data from webpages`;
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'URL',
                name: 'url',
                type: 'string'
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Get Relative Links Method',
                name: 'relativeLinksMethod',
                type: 'options',
                description: 'Select a method to retrieve relative links',
                options: [
                    {
                        label: 'Web Crawl',
                        name: 'webCrawl',
                        description: 'Crawl relative links from HTML URL'
                    },
                    {
                        label: 'Scrape XML Sitemap',
                        name: 'scrapeXMLSitemap',
                        description: 'Scrape relative links from XML sitemap URL'
                    }
                ],
                default: 'webCrawl',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Get Relative Links Limit',
                name: 'limit',
                type: 'number',
                optional: true,
                default: '10',
                additionalParams: true,
                description: 'Only used when "Get Relative Links Method" is selected. Set 0 to retrieve all relative links, default limit is 10.',
                warning: `Retrieving all links might take long time, and all links will be upserted again if the flow's state changed (eg: different URL, chunk size, etc)`
            },
            {
                label: 'Wait Until',
                name: 'waitUntilGoToOption',
                type: 'options',
                description: 'Select a go to wait until option',
                options: [
                    {
                        label: 'Load',
                        name: 'load',
                        description: `When the initial HTML document's DOM has been loaded and parsed`
                    },
                    {
                        label: 'DOM Content Loaded',
                        name: 'domcontentloaded',
                        description: `When the complete HTML document's DOM has been loaded and parsed`
                    },
                    {
                        label: 'Network Idle 0',
                        name: 'networkidle0',
                        description: 'Navigation is finished when there are no more than 0 network connections for at least 500 ms'
                    },
                    {
                        label: 'Network Idle 2',
                        name: 'networkidle2',
                        description: 'Navigation is finished when there are no more than 2 network connections for at least 500 ms'
                    }
                ],
                optional: true,
                additionalParams: true
            },
            {
                label: 'Wait for selector to load',
                name: 'waitForSelector',
                type: 'string',
                optional: true,
                additionalParams: true,
                description: 'CSS selectors like .div or #div'
            },
            {
                label: 'CSS Selector (Optional)',
                name: 'cssSelector',
                type: 'string',
                description: 'Only content inside this selector will be extracted. Leave empty to use the entire page body.',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Additional Metadata',
                name: 'metadata',
                type: 'json',
                description: 'Additional metadata to be added to the extracted documents',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Omit Metadata Keys',
                name: 'omitMetadataKeys',
                type: 'string',
                rows: 4,
                description: 'Each document loader comes with a default set of metadata keys that are extracted from the document. You can use this field to omit some of the default metadata keys. The value should be a list of keys, seperated by comma. Use * to omit all metadata keys execept the ones you specify in the Additional Metadata field',
                placeholder: 'key1, key2, key3.nestedKey1',
                optional: true,
                additionalParams: true
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
        const relativeLinksMethod = nodeData.inputs?.relativeLinksMethod;
        const selectedLinks = nodeData.inputs?.selectedLinks;
        let limit = parseInt(nodeData.inputs?.limit);
        const waitUntilGoToOption = nodeData.inputs?.waitUntilGoToOption;
        const waitForSelector = nodeData.inputs?.waitForSelector;
        const cssSelector = nodeData.inputs?.cssSelector;
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys;
        const output = nodeData.outputs?.output;
        const orgId = options.orgId;
        let omitMetadataKeys = [];
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim());
        }
        let url = nodeData.inputs?.url;
        url = url.trim();
        if (!(0, linkifyjs_1.test)(url)) {
            throw new Error('Invalid URL');
        }
        async function puppeteerLoader(url) {
            try {
                let docs = [];
                const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
                const config = {
                    launchOptions: {
                        args: ['--no-sandbox'],
                        headless: 'new',
                        executablePath: executablePath
                    }
                };
                if (waitUntilGoToOption) {
                    config['gotoOptions'] = {
                        waitUntil: waitUntilGoToOption
                    };
                }
                if (cssSelector || waitForSelector) {
                    config['evaluate'] = async (page, _) => {
                        if (waitForSelector) {
                            await page.waitForSelector(waitForSelector);
                        }
                        if (cssSelector) {
                            const selectorHandle = await page.$(cssSelector);
                            const result = await page.evaluate((htmlSelection) => htmlSelection?.innerHTML ?? document.body.innerHTML, selectorHandle);
                            return result;
                        }
                        else {
                            return await page.evaluate(() => document.body.innerHTML);
                        }
                    };
                }
                const loader = new puppeteer_1.PuppeteerWebBaseLoader(url, config);
                if (textSplitter) {
                    docs = await loader.load();
                    docs = await textSplitter.splitDocuments(docs);
                }
                else {
                    docs = await loader.load();
                }
                return docs;
            }
            catch (err) {
                if (process.env.DEBUG === 'true')
                    options.logger.error(`[${orgId}]: Error in PuppeteerWebBaseLoader: ${err.message}, on page: ${url}`);
            }
        }
        let docs = [];
        if (relativeLinksMethod) {
            if (process.env.DEBUG === 'true')
                options.logger.info(`[${orgId}]: Start PuppeteerWebBaseLoader ${relativeLinksMethod}`);
            // if limit is 0 we don't want it to default to 10 so we check explicitly for null or undefined
            // so when limit is 0 we can fetch all the links
            if (limit === null || limit === undefined)
                limit = 10;
            else if (limit < 0)
                throw new Error('Limit cannot be less than 0');
            const pages = selectedLinks && selectedLinks.length > 0
                ? selectedLinks.slice(0, limit === 0 ? undefined : limit)
                : relativeLinksMethod === 'webCrawl'
                    ? await (0, src_1.webCrawl)(url, limit)
                    : await (0, src_1.xmlScrape)(url, limit);
            if (process.env.DEBUG === 'true')
                options.logger.info(`[${orgId}]: PuppeteerWebBaseLoader pages: ${JSON.stringify(pages)}, length: ${pages.length}`);
            if (!pages || pages.length === 0)
                throw new Error('No relative links found');
            for (const page of pages) {
                const result = await puppeteerLoader(page);
                if (result) {
                    docs.push(...result);
                }
            }
            if (process.env.DEBUG === 'true')
                options.logger.info(`[${orgId}]: Finish PuppeteerWebBaseLoader ${relativeLinksMethod}`);
        }
        else if (selectedLinks && selectedLinks.length > 0) {
            if (process.env.DEBUG === 'true')
                options.logger.info(`[${orgId}]: PuppeteerWebBaseLoader pages: ${JSON.stringify(selectedLinks)}, length: ${selectedLinks.length}`);
            for (const page of selectedLinks.slice(0, limit)) {
                const result = await puppeteerLoader(page);
                if (result) {
                    docs.push(...result);
                }
            }
        }
        else {
            const result = await puppeteerLoader(url);
            if (result) {
                docs.push(...result);
            }
        }
        if (metadata) {
            const parsedMetadata = typeof metadata === 'object' ? metadata : JSON.parse(metadata);
            docs = docs.map((doc) => ({
                ...doc,
                metadata: _omitMetadataKeys === '*'
                    ? {
                        ...parsedMetadata
                    }
                    : (0, lodash_1.omit)({
                        ...doc.metadata,
                        ...parsedMetadata
                    }, omitMetadataKeys)
            }));
        }
        else {
            docs = docs.map((doc) => ({
                ...doc,
                metadata: _omitMetadataKeys === '*'
                    ? {}
                    : (0, lodash_1.omit)({
                        ...doc.metadata
                    }, omitMetadataKeys)
            }));
        }
        if (output === 'document') {
            return docs;
        }
        else {
            let finaltext = '';
            for (const doc of docs) {
                finaltext += `${doc.pageContent}\n`;
            }
            return (0, src_1.handleEscapeCharacters)(finaltext, false);
        }
    }
}
module.exports = { nodeClass: Puppeteer_DocumentLoaders };
//# sourceMappingURL=Puppeteer.js.map