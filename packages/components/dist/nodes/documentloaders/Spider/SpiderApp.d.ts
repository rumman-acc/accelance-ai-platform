interface SpiderAppConfig {
    apiKey?: string | null;
    apiUrl?: string | null;
}
interface SpiderDocumentMetadata {
    title?: string;
    description?: string;
    language?: string;
    [key: string]: any;
}
interface SpiderDocument {
    id?: string;
    url?: string;
    content: string;
    markdown?: string;
    html?: string;
    createdAt?: Date;
    updatedAt?: Date;
    type?: string;
    metadata: SpiderDocumentMetadata;
}
interface ScrapeResponse {
    success: boolean;
    data?: SpiderDocument;
    error?: string;
}
interface CrawlResponse {
    success: boolean;
    data?: SpiderDocument[];
    error?: string;
}
interface Params {
    [key: string]: any;
}
declare class SpiderApp {
    private apiKey;
    private apiUrl;
    constructor({ apiKey, apiUrl }: SpiderAppConfig);
    scrapeUrl(url: string, params?: Params | null): Promise<ScrapeResponse>;
    crawlUrl(url: string, params?: Params | null, idempotencyKey?: string): Promise<CrawlResponse | any>;
    private prepareHeaders;
    private postRequest;
    private handleError;
}
export default SpiderApp;
