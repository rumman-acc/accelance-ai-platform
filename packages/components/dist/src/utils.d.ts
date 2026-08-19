import { DocumentLoader } from '@langchain/classic/document_loaders/base';
import { Document } from '@langchain/core/documents';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessageChunk, BaseMessage } from '@langchain/core/messages';
import { Runnable, type RunnableConfig } from '@langchain/core/runnables';
import { TextSplitter } from '@langchain/textsplitters';
import { DataSource } from 'typeorm';
import zodToJsonSchema, { type JsonSchema7Type } from 'zod-to-json-schema';
import { z } from 'zod/v3';
import { ICommonObject, IDatabaseEntity, IMessage, INodeData, IVariable } from './Interface';
export declare const numberOrExpressionRegex = "^(\\d+\\.?\\d*|{{.*}})$";
export declare const notEmptyRegex = "(.|\\s)*\\S(.|\\s)*";
export declare const FLOWISE_CHATID = "flowise_chatId";
export declare const availableDependencies: string[];
export declare const defaultAllowBuiltInDep: string[];
/**
 * Get base classes of components
 *
 * @export
 * @param {any} targetClass
 * @returns {string[]}
 */
export declare const getBaseClasses: (targetClass: any) => string[];
/**
 * Serialize axios query params
 *
 * @export
 * @param {any} params
 * @param {boolean} skipIndex // Set to true if you want same params to be: param=1&param=2 instead of: param[0]=1&param[1]=2
 * @returns {string}
 */
export declare function serializeQueryParams(params: any, skipIndex?: boolean): string;
/**
 * Handle error from try catch
 *
 * @export
 * @param {any} error
 * @returns {string}
 */
export declare function handleErrorMessage(error: any): string;
/**
 * Returns the path of node modules package
 * @param {string} packageName
 * @returns {string}
 */
export declare const getNodeModulesPackagePath: (packageName: string) => string;
/**
 * Get input variables
 * @param {string} paramValue
 * @returns {boolean}
 */
export declare const getInputVariables: (paramValue: string) => string[];
/**
 * Transform single curly braces into double curly braces if the content includes a colon.
 * @param input - The original string that may contain { ... } segments.
 * @returns The transformed string, where { ... } containing a colon has been replaced with {{ ... }}.
 */
export declare const transformBracesWithColon: (input: string) => string;
/**
 * Creates a streaming-compatible output parser that extracts text content from
 * chat model responses, filtering out reasoning/thinking content blocks.
 * https://github.com/FlowiseAI/Flowise/pull/5893#issuecomment-4045466531
 */
export declare const createTextOnlyOutputParser: () => TextOnlyOutputParser;
declare class TextOnlyOutputParser extends Runnable<AIMessageChunk, string> {
    static lc_name(): string;
    lc_namespace: string[];
    invoke(input: AIMessageChunk, _options?: Partial<RunnableConfig>): Promise<string>;
    _transform(generator: AsyncGenerator<AIMessageChunk>): AsyncGenerator<string>;
    transform(generator: AsyncGenerator<AIMessageChunk>, options?: Partial<RunnableConfig>): AsyncGenerator<string>;
}
/**
 * Crawl all available urls given a domain url and limit
 * @param {string} url
 * @param {number} limit
 * @returns {string[]}
 */
export declare const getAvailableURLs: (url: string, limit: number) => Promise<string[]>;
/**
 * Prep URL before passing into recursive crawl function
 * @param {string} stringURL
 * @param {number} limit
 * @returns {Promise<string[]>}
 */
export declare function webCrawl(stringURL: string, limit: number): Promise<string[]>;
export declare function getURLsFromXML(xmlBody: string, limit: number): string[];
export declare function xmlScrape(currentURL: string, limit: number): Promise<string[]>;
/**
 * Get env variables
 * @param {string} name
 * @returns {string | undefined}
 */
export declare const getEnvironmentVariable: (name: string) => string | undefined;
export declare const getEncryptionKeyPath: () => string;
/**
 * Decrypt credential data
 * @param {string} encryptedData
 * @param {string} componentCredentialName
 * @param {IComponentCredentials} componentCredentials
 * @returns {Promise<ICommonObject>}
 */
export declare const decryptCredentialData: (encryptedData: string) => Promise<ICommonObject>;
/**
 * Get credential data
 * @param {string} selectedCredentialId
 * @param {ICommonObject} options
 * @returns {Promise<ICommonObject>}
 */
export declare const getCredentialData: (selectedCredentialId: string, options: ICommonObject) => Promise<ICommonObject>;
/**
 * Get first non falsy value
 *
 * @param {...any} values
 *
 * @returns {any|undefined}
 */
export declare const defaultChain: (...values: any[]) => any | undefined;
export declare const getCredentialParam: (paramName: string, credentialData: ICommonObject, nodeData: INodeData, defaultValue?: any) => any;
export declare function handleEscapeCharacters(input: any, reverse: Boolean): any;
/**
 * Get user home dir
 * @returns {string}
 */
export declare const getUserHome: () => string;
/**
 * Map ChatMessage to BaseMessage
 * @param {IChatMessage[]} chatmessages
 * @returns {BaseMessage[]}
 */
export declare const mapChatMessageToBaseMessage: (chatmessages: any[] | undefined, orgId: string) => Promise<BaseMessage[]>;
/**
 * Convert incoming chat history to string
 * @param {IMessage[]} chatHistory
 * @returns {string}
 */
export declare const convertChatHistoryToText: (chatHistory?: IMessage[] | {
    content: string;
    role: string;
}[]) => string;
/**
 * Serialize array chat history to string
 * @param {string | Array<string>} chatHistory
 * @returns {string}
 */
export declare const serializeChatHistory: (chatHistory: string | Array<string>) => string;
/**
 * Convert schema to zod schema
 * @param {string | object} schema
 * @returns {ICommonObject}
 */
export declare const convertSchemaToZod: (schema: string | object) => ICommonObject;
/**
 * Flatten nested object
 * @param {ICommonObject} obj
 * @param {string} parentKey
 * @returns {ICommonObject}
 */
export declare const flattenObject: (obj: ICommonObject, parentKey?: string) => any;
/**
 * Convert BaseMessage to IMessage
 * @param {BaseMessage[]} messages
 * @returns {IMessage[]}
 */
export declare const convertBaseMessagetoIMessage: (messages: BaseMessage[]) => IMessage[];
/**
 * Convert MultiOptions String to String Array
 * @param {string} inputString
 * @returns {string[]}
 */
export declare const convertMultiOptionsToStringArray: (inputString: string) => string[];
/**
 * Get variables
 * @param {DataSource} appDataSource
 * @param {IDatabaseEntity} databaseEntities
 * @param {INodeData} nodeData
 */
export declare const getVars: (appDataSource: DataSource, databaseEntities: IDatabaseEntity, nodeData: INodeData, options: ICommonObject) => Promise<IVariable[]>;
/**
 * Prepare sandbox variables
 * @param {IVariable[]} variables
 */
export declare const prepareSandboxVars: (variables: IVariable[]) => {};
export declare const getVersion: () => Promise<{
    version: string;
}>;
/**
 * Map Ext to InputField
 * @param {string} ext
 * @returns {string}
 */
export declare const mapExtToInputField: (ext: string) => "txtFile" | "pdfFile" | "jsonFile" | "csvFile" | "jsonlinesFile" | "docxFile" | "yamlFile";
/**
 * Map MimeType to InputField
 * @param {string} mimeType
 * @returns {string}
 */
export declare const mapMimeTypeToInputField: (mimeType: string) => "txtFile" | "pdfFile" | "jsonFile" | "csvFile" | "jsonlinesFile" | "docxFile" | "excelFile" | "powerpointFile" | "yamlFile";
/**
 * Map MimeType to Extension
 * @param {string} mimeType
 * @returns {string}
 */
export declare const mapMimeTypeToExt: (mimeType: string) => "" | "json" | "txt" | "html" | "css" | "js" | "xml" | "md" | "pdf" | "csv" | "jsonl" | "yaml" | "sql" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" | "rtf" | "jpg" | "png" | "gif" | "webp" | "svg" | "bmp" | "tiff" | "ico" | "avif" | "webm" | "m4a" | "mp3" | "ogg" | "wav" | "aac" | "flac" | "mp4" | "mov" | "avi";
/**
 * MIME types allowed for full file upload (chatflow config).
 * Server validates stored allowedUploadFileTypes against this list to prevent
 * malicious clients from allowing executables or other dangerous types.
 * Uses a Set for O(1) lookups and to make the unique allowed set explicit.
 */
export declare const ALLOWED_UPLOAD_MIME_TYPES: ReadonlySet<string>;
/**
 * Returns true if the MIME type is allowed for file upload config.
 * Must be in ALLOWED_UPLOAD_MIME_TYPES and have a mapping in mapMimeTypeToExt.
 * @param {string} mime
 * @returns {boolean}
 */
export declare const isAllowedUploadMimeType: (mime: string) => boolean;
export declare const removeInvalidImageMarkdown: (output: string) => string;
/**
 * Extract output from array
 * @param {any} output
 * @returns {string}
 */
export declare const extractOutputFromArray: (output: any) => string;
/**
 * Loop through the object and replace the key with the value
 * @param {any} obj
 * @param {any} sourceObj
 * @returns {any}
 */
export declare const resolveFlowObjValue: (obj: any, sourceObj: any) => any;
export declare const handleDocumentLoaderOutput: (docs: Document[], output: string) => any;
export declare const parseDocumentLoaderMetadata: (metadata: object | string) => object;
export declare const handleDocumentLoaderMetadata: (docs: Document[], _omitMetadataKeys: string, metadata?: object | string, sourceIdKey?: string) => {
    metadata: object;
    pageContent: string;
    id?: string;
}[];
export declare const handleDocumentLoaderDocuments: (loader: DocumentLoader, textSplitter?: TextSplitter) => Promise<Document<Record<string, any>>[]>;
/**
 * Normalize special characters in key to be used in vector store
 * @param str - Key to normalize
 * @returns Normalized key
 */
export declare const normalizeSpecialChars: (str: string) => string;
/**
 * recursively normalize object keys
 * @param data - Object to normalize
 * @returns Normalized object
 */
export declare const normalizeKeysRecursively: (data: any) => any;
/**
 * Check if OAuth2 token is expired and refresh if needed
 * @param {string} credentialId
 * @param {ICommonObject} credentialData
 * @param {ICommonObject} options
 * @param {number} bufferTimeMs - Buffer time in milliseconds before expiry (default: 5 minutes)
 * @returns {Promise<ICommonObject>}
 */
export declare const refreshOAuth2Token: (credentialId: string, credentialData: ICommonObject, options: ICommonObject, bufferTimeMs?: number) => Promise<ICommonObject>;
export declare const stripHTMLFromToolInput: (input: string) => string;
export declare const COMMONJS_REQUIRE_REGEX: RegExp;
export declare const IMPORT_EXTRACTION_REGEX: RegExp;
export declare const convertRequireToImport: (requireLine: string) => string | null;
/**
 * Execute JavaScript code using either Sandbox or NodeVM
 * @param {string} code - The JavaScript code to execute
 * @param {ICommonObject} sandbox - The sandbox object with variables
 * @param {ICommonObject} options - Execution options
 * @returns {Promise<any>} - The execution result
 */
export declare const executeJavaScriptCode: (code: string, sandbox: ICommonObject, options?: {
    timeout?: number;
    useSandbox?: boolean;
    libraries?: string[];
    streamOutput?: (output: string) => void;
    nodeVMOptions?: ICommonObject;
}) => Promise<any>;
/**
 * Create a standard sandbox object for code execution
 * @param {string} input - The input string
 * @param {ICommonObject} variables - Variables from getVars
 * @param {ICommonObject} flow - Flow object with chatflowId, sessionId, etc.
 * @param {ICommonObject} additionalSandbox - Additional sandbox variables
 * @returns {ICommonObject} - The sandbox object
 */
export declare const createCodeExecutionSandbox: (input: string, variables: IVariable[], flow: ICommonObject, additionalSandbox?: ICommonObject) => ICommonObject;
/**
 * Process template variables in state object, replacing {{ output }} and {{ output.property }} patterns
 * @param {ICommonObject} state - The state object to process
 * @param {any} finalOutput - The output value to substitute
 * @returns {ICommonObject} - The processed state object
 */
export declare const processTemplateVariables: (state: ICommonObject, finalOutput: any) => ICommonObject;
/**
 * Parse JSON body with comprehensive error handling and cleanup
 * @param {string} body - The JSON string to parse
 * @returns {any} - The parsed JSON object
 * @throws {Error} - Detailed error message with suggestions for common JSON issues
 */
export declare const parseJsonBody: (body: string) => any;
/**
 * Parse a value against a Zod schema with automatic type conversion for common type mismatches
 * @param schema - The Zod schema to parse against
 * @param arg - The value to parse
 * @param maxDepth - Maximum recursion depth to prevent infinite loops (default: 10)
 * @returns The parsed value
 * @throws Error if parsing fails after attempting type conversions
 */
export declare function parseWithTypeConversion<T extends z.ZodTypeAny>(schema: T, arg: unknown, maxDepth?: number): Promise<z.infer<T>>;
/**
 * Configures structured output for the LLM using Zod schema
 * @param {BaseChatModel} llmNodeInstance - The LLM instance to configure
 * @param {any[]} structuredOutput - Array of structured output schema definitions
 * @returns {BaseChatModel} - The configured LLM instance
 */
export declare const configureStructuredOutput: (llmNodeInstance: BaseChatModel, structuredOutput: any[]) => BaseChatModel;
/**
 * Creates a Zod schema from a JSON schema object
 * @param {any} jsonSchema - The JSON schema object
 * @returns {z.ZodTypeAny} - A Zod schema
 */
export declare const createZodSchemaFromJSON: (jsonSchema: any) => z.ZodTypeAny;
export declare const extractResponseContent: (response: any) => string;
export declare const isReasoningModelOpenAI: (name: string) => boolean;
/**
 * JSON Schema shape returned by {@link toolSchemaToJsonSchema}, extended with the
 * optional `$schema` marker that `zod-to-json-schema` emits.
 */
export type ToolJsonSchema = JsonSchema7Type & {
    $schema?: string;
    [key: string]: unknown;
};
type ZodToJsonSchemaInput = Parameters<typeof zodToJsonSchema>[0];
/**
 * Type guard detecting a Zod schema without importing Zod's types directly.
 *
 * Using `Parameters<typeof zodToJsonSchema>[0]` keeps the guard compatible with
 * whichever Zod major version (`^3 || ^4`) TypeScript resolves at the call site.
 */
export declare const isZodSchema: (schema: unknown) => schema is ZodToJsonSchemaInput;
/**
 * Normalizes a tool schema into a plain JSON Schema object.
 *
 * LangChain tools may expose their `schema` as either a Zod schema (has `_def`)
 * or an already-plain JSON Schema (e.g. MCP tools). This helper handles both,
 * deep-clones plain objects to prevent accidental mutation, and strips the
 * `$schema` marker so the result is safe to embed in LLM tool definitions.
 */
export declare const toolSchemaToJsonSchema: (schema: unknown) => ToolJsonSchema;
export {};
