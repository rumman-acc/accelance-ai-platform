"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const awsToolsUtils_1 = require("../../../src/awsToolsUtils");
const client_s3_1 = require("@aws-sdk/client-s3");
const modelLoader_1 = require("../../../src/modelLoader");
const node_stream_1 = require("node:stream");
const fsDefault = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const directory_1 = require("@langchain/classic/document_loaders/fs/directory");
const json_1 = require("@langchain/classic/document_loaders/fs/json");
const pdf_1 = require("@langchain/community/document_loaders/fs/pdf");
const docx_1 = require("@langchain/community/document_loaders/fs/docx");
const text_1 = require("@langchain/classic/document_loaders/fs/text");
const CsvLoader_1 = require("../Csv/CsvLoader");
const ExcelLoader_1 = require("../MicrosoftExcel/ExcelLoader");
const PowerpointLoader_1 = require("../MicrosoftPowerpoint/PowerpointLoader");
class S3_DocumentLoaders {
    constructor() {
        this.loadMethods = {
            async listRegions() {
                return await (0, modelLoader_1.getRegions)(modelLoader_1.MODEL_TYPE.CHAT, 'awsChatBedrock');
            }
        };
        this.label = 'S3 Directory';
        this.name = 's3Directory';
        this.version = 4.0;
        this.type = 'Document';
        this.icon = 's3.svg';
        this.category = 'Document Loaders';
        this.description = 'Load Data from S3 Buckets';
        this.baseClasses = [this.type];
        this.credential = {
            label: 'Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['awsApi'],
            optional: true
        };
        this.inputs = [
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Bucket',
                name: 'bucketName',
                type: 'string'
            },
            {
                label: 'Region',
                name: 'region',
                type: 'asyncOptions',
                loadMethod: 'listRegions',
                default: 'us-east-1'
            },
            {
                label: 'Server URL',
                name: 'serverUrl',
                description: 'The fully qualified endpoint of the webservice. This is only for using a custom endpoint (for example, when using a local version of S3).',
                type: 'string',
                optional: true
            },
            {
                label: 'Prefix',
                name: 'prefix',
                type: 'string',
                description: 'Limits the response to keys that begin with the specified prefix',
                placeholder: 'TestFolder/Something',
                optional: true
            },
            {
                label: 'Pdf Usage',
                name: 'pdfUsage',
                type: 'options',
                options: [
                    {
                        label: 'One document per page',
                        name: 'perPage'
                    },
                    {
                        label: 'One document per file',
                        name: 'perFile'
                    }
                ],
                default: 'perPage',
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
        const bucketName = nodeData.inputs?.bucketName;
        const prefix = nodeData.inputs?.prefix;
        const region = nodeData.inputs?.region;
        const serverUrl = nodeData.inputs?.serverUrl;
        const pdfUsage = nodeData.inputs?.pdfUsage;
        const metadata = nodeData.inputs?.metadata;
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys;
        const output = nodeData.outputs?.output;
        let credentials;
        if (nodeData.credential) {
            const credentialConfig = await (0, awsToolsUtils_1.getAWSCredentialConfig)(nodeData, options, region);
            credentials = credentialConfig.credentials;
        }
        let s3Config = {
            region: region,
            credentials: credentials
        };
        if (serverUrl) {
            s3Config = {
                region: region,
                credentials: credentials,
                endpoint: serverUrl,
                forcePathStyle: true
            };
        }
        const tempDir = fsDefault.mkdtempSync(path.join(os.tmpdir(), 's3fileloader-'));
        try {
            const s3Client = new client_s3_1.S3Client(s3Config);
            const listObjectsOutput = await s3Client.send(new client_s3_1.ListObjectsV2Command({
                Bucket: bucketName,
                Prefix: prefix
            }));
            const keys = (listObjectsOutput?.Contents ?? []).filter((item) => item.Key && item.ETag).map((item) => item.Key);
            await Promise.all(keys.map(async (key) => {
                const filePath = path.join(tempDir, key);
                try {
                    const response = await s3Client.send(new client_s3_1.GetObjectCommand({
                        Bucket: bucketName,
                        Key: key
                    }));
                    const objectData = await new Promise((resolve, reject) => {
                        const chunks = [];
                        if (response.Body instanceof node_stream_1.Readable) {
                            response.Body.on('data', (chunk) => chunks.push(chunk));
                            response.Body.on('end', () => resolve(Buffer.concat(chunks)));
                            response.Body.on('error', reject);
                        }
                        else {
                            reject(new Error('Response body is not a readable stream.'));
                        }
                    });
                    // create the directory if it doesnt already exist
                    fsDefault.mkdirSync(path.dirname(filePath), { recursive: true });
                    // write the file to the directory
                    fsDefault.writeFileSync(filePath, objectData);
                }
                catch (e) {
                    throw new Error(`Failed to download file ${key} from S3 bucket ${bucketName}: ${e.message}`);
                }
            }));
            const loader = new directory_1.DirectoryLoader(tempDir, {
                '.json': (path) => new json_1.JSONLoader(path),
                '.txt': (path) => new text_1.TextLoader(path),
                '.csv': (path) => new CsvLoader_1.CSVLoader(path),
                '.xls': (path) => new ExcelLoader_1.LoadOfSheet(path),
                '.xlsx': (path) => new ExcelLoader_1.LoadOfSheet(path),
                '.xlsm': (path) => new ExcelLoader_1.LoadOfSheet(path),
                '.xlsb': (path) => new ExcelLoader_1.LoadOfSheet(path),
                '.docx': (path) => new docx_1.DocxLoader(path),
                '.ppt': (path) => new PowerpointLoader_1.PowerpointLoader(path),
                '.pptx': (path) => new PowerpointLoader_1.PowerpointLoader(path),
                '.pdf': (path) => new pdf_1.PDFLoader(path, {
                    splitPages: pdfUsage !== 'perFile',
                    // @ts-ignore
                    pdfjs: () => Promise.resolve().then(() => __importStar(require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js')))
                }),
                '.aspx': (path) => new text_1.TextLoader(path),
                '.asp': (path) => new text_1.TextLoader(path),
                '.cpp': (path) => new text_1.TextLoader(path), // C++
                '.c': (path) => new text_1.TextLoader(path),
                '.cs': (path) => new text_1.TextLoader(path),
                '.css': (path) => new text_1.TextLoader(path),
                '.go': (path) => new text_1.TextLoader(path), // Go
                '.h': (path) => new text_1.TextLoader(path), // C++ Header files
                '.kt': (path) => new text_1.TextLoader(path), // Kotlin
                '.java': (path) => new text_1.TextLoader(path), // Java
                '.js': (path) => new text_1.TextLoader(path), // JavaScript
                '.less': (path) => new text_1.TextLoader(path), // Less files
                '.ts': (path) => new text_1.TextLoader(path), // TypeScript
                '.php': (path) => new text_1.TextLoader(path), // PHP
                '.proto': (path) => new text_1.TextLoader(path), // Protocol Buffers
                '.python': (path) => new text_1.TextLoader(path), // Python
                '.py': (path) => new text_1.TextLoader(path), // Python
                '.rst': (path) => new text_1.TextLoader(path), // reStructuredText
                '.ruby': (path) => new text_1.TextLoader(path), // Ruby
                '.rb': (path) => new text_1.TextLoader(path), // Ruby
                '.rs': (path) => new text_1.TextLoader(path), // Rust
                '.scala': (path) => new text_1.TextLoader(path), // Scala
                '.sc': (path) => new text_1.TextLoader(path), // Scala
                '.scss': (path) => new text_1.TextLoader(path), // Sass
                '.sol': (path) => new text_1.TextLoader(path), // Solidity
                '.sql': (path) => new text_1.TextLoader(path), //SQL
                '.swift': (path) => new text_1.TextLoader(path), // Swift
                '.markdown': (path) => new text_1.TextLoader(path), // Markdown
                '.md': (path) => new text_1.TextLoader(path), // Markdown
                '.tex': (path) => new text_1.TextLoader(path), // LaTeX
                '.ltx': (path) => new text_1.TextLoader(path), // LaTeX
                '.html': (path) => new text_1.TextLoader(path), // HTML
                '.vb': (path) => new text_1.TextLoader(path), // Visual Basic
                '.xml': (path) => new text_1.TextLoader(path) // XML
            }, true);
            let docs = await (0, utils_1.handleDocumentLoaderDocuments)(loader, textSplitter);
            docs = (0, utils_1.handleDocumentLoaderMetadata)(docs, _omitMetadataKeys, metadata);
            return (0, utils_1.handleDocumentLoaderOutput)(docs, output);
        }
        catch (e) {
            throw new Error(`Failed to load data from bucket ${bucketName}: ${e.message}`);
        }
        finally {
            // remove the temp directory before returning docs
            fsDefault.rmSync(tempDir, { recursive: true });
        }
    }
}
module.exports = { nodeClass: S3_DocumentLoaders };
//# sourceMappingURL=S3Directory.js.map