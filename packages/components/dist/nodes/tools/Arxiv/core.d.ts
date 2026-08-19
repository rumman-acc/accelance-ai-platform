import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
export declare const desc = "Use this tool to search for academic papers on Arxiv. You can search by keywords, topics, authors, or specific Arxiv IDs. The tool can return either paper summaries or download and extract full paper content.";
export interface ArxivParameters {
    topKResults?: number;
    maxQueryLength?: number;
    docContentCharsMax?: number;
    loadFullContent?: boolean;
    continueOnFailure?: boolean;
    legacyBuild?: boolean;
    name?: string;
    description?: string;
}
export declare class ArxivTool extends DynamicStructuredTool {
    topKResults: number;
    maxQueryLength: number;
    docContentCharsMax: number;
    loadFullContent: boolean;
    continueOnFailure: boolean;
    legacyBuild: boolean;
    logger?: any;
    orgId?: string;
    constructor(args?: ArxivParameters, logger?: any, orgId?: string);
    private isArxivIdentifier;
    private parseArxivResponse;
    private extractXmlValue;
    private fetchResults;
    private downloadAndExtractPdf;
    /** @ignore */
    _call(arg: any): Promise<string>;
}
