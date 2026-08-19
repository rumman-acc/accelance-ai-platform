import type { NotionAPILoader } from '@langchain/community/document_loaders/web/notionapi';
/**
 * Overrides the default table block handler on a NotionAPILoader instance
 * to produce compact markdown tables without the excessive cell padding
 * added by the markdown-table library's default options.
 */
export declare function applyCompactTableTransformer(loader: NotionAPILoader): void;
