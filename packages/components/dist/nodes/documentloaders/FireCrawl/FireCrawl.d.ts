import { DocumentInterface } from '@langchain/core/documents';
import { BaseDocumentLoader } from '@langchain/classic/document_loaders/base';
interface FirecrawlLoaderParameters {
    url?: string;
    query?: string;
    apiKey?: string;
    apiUrl?: string;
    mode?: 'crawl' | 'scrape' | 'extract' | 'search';
    params?: Record<string, unknown>;
}
export declare class FireCrawlLoader extends BaseDocumentLoader {
    private apiKey;
    private apiUrl;
    private url?;
    private query?;
    private mode;
    private params?;
    constructor(loaderParams: FirecrawlLoaderParameters);
    load(): Promise<DocumentInterface[]>;
}
export {};
