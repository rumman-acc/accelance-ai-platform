"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class Arxiv_Tools {
    constructor() {
        this.label = 'Arxiv';
        this.name = 'arxiv';
        this.version = 1.0;
        this.type = 'Arxiv';
        this.icon = 'arxiv.png';
        this.category = 'Tools';
        this.description = 'Search and read content from academic papers on Arxiv';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(core_1.ArxivTool)];
        this.inputs = [
            {
                label: 'Name',
                name: 'arxivName',
                type: 'string',
                default: 'arxiv_search',
                description: 'Name of the tool',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Description',
                name: 'arxivDescription',
                type: 'string',
                rows: 4,
                default: core_1.desc,
                description: 'Describe to LLM when it should use this tool',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Top K Results',
                name: 'topKResults',
                type: 'number',
                description: 'Number of top results to return from Arxiv search',
                default: '3',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Max Query Length',
                name: 'maxQueryLength',
                type: 'number',
                description: 'Maximum length of the search query',
                default: '300',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Max Content Length',
                name: 'docContentCharsMax',
                type: 'number',
                description: 'Maximum length of the returned content. Set to 0 for unlimited',
                default: '10000',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Load Full Content',
                name: 'loadFullContent',
                type: 'boolean',
                description: 'Download PDFs and extract full paper content instead of just summaries. Warning: This is slower and uses more resources.',
                default: false,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Continue On Failure',
                name: 'continueOnFailure',
                type: 'boolean',
                description: 'Continue processing other papers if one fails to download/parse (only applies when Load Full Content is enabled)',
                default: false,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Use Legacy Build',
                name: 'legacyBuild',
                type: 'boolean',
                description: 'Use legacy PDF.js build for PDF parsing (only applies when Load Full Content is enabled)',
                default: false,
                optional: true,
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const name = nodeData.inputs?.name || nodeData.inputs?.arxivName;
        const description = nodeData.inputs?.description || nodeData.inputs?.arxivDescription;
        const topKResults = nodeData.inputs?.topKResults;
        const maxQueryLength = nodeData.inputs?.maxQueryLength;
        const docContentCharsMax = nodeData.inputs?.docContentCharsMax;
        const loadFullContent = nodeData.inputs?.loadFullContent;
        const continueOnFailure = nodeData.inputs?.continueOnFailure;
        const legacyBuild = nodeData.inputs?.legacyBuild;
        let logger;
        const orgId = options.orgId;
        if (process.env.DEBUG === 'true') {
            logger = options.logger;
        }
        const obj = {};
        if (description)
            obj.description = description;
        if (name)
            obj.name = name
                .toLowerCase()
                .replace(/ /g, '_')
                .replace(/[^a-z0-9_-]/g, '');
        if (topKResults)
            obj.topKResults = parseInt(topKResults, 10);
        if (maxQueryLength)
            obj.maxQueryLength = parseInt(maxQueryLength, 10);
        if (docContentCharsMax) {
            const maxChars = parseInt(docContentCharsMax, 10);
            obj.docContentCharsMax = maxChars === 0 ? undefined : maxChars;
        }
        if (loadFullContent !== undefined)
            obj.loadFullContent = loadFullContent;
        if (continueOnFailure !== undefined)
            obj.continueOnFailure = continueOnFailure;
        if (legacyBuild !== undefined)
            obj.legacyBuild = legacyBuild;
        return new core_1.ArxivTool(obj, logger, orgId);
    }
}
module.exports = { nodeClass: Arxiv_Tools };
//# sourceMappingURL=Arxiv.js.map