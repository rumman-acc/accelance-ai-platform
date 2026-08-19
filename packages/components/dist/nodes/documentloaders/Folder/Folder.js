'use strict'
var __createBinding =
    (this && this.__createBinding) ||
    (Object.create
        ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k
              var desc = Object.getOwnPropertyDescriptor(m, k)
              if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
                  desc = {
                      enumerable: true,
                      get: function () {
                          return m[k]
                      }
                  }
              }
              Object.defineProperty(o, k2, desc)
          }
        : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k
              o[k2] = m[k]
          })
var __setModuleDefault =
    (this && this.__setModuleDefault) ||
    (Object.create
        ? function (o, v) {
              Object.defineProperty(o, 'default', { enumerable: true, value: v })
          }
        : function (o, v) {
              o['default'] = v
          })
var __importStar =
    (this && this.__importStar) ||
    function (mod) {
        if (mod && mod.__esModule) return mod
        var result = {}
        if (mod != null)
            for (var k in mod) if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k)
        __setModuleDefault(result, mod)
        return result
    }
Object.defineProperty(exports, '__esModule', { value: true })
const lodash_1 = require('lodash')
const text_1 = require('@langchain/classic/document_loaders/fs/text')
const directory_1 = require('@langchain/classic/document_loaders/fs/directory')
const json_1 = require('@langchain/classic/document_loaders/fs/json')
const csv_1 = require('@langchain/community/document_loaders/fs/csv')
const pdf_1 = require('@langchain/community/document_loaders/fs/pdf')
const docx_1 = require('@langchain/community/document_loaders/fs/docx')
const ExcelLoader_1 = require('../MicrosoftExcel/ExcelLoader')
const PowerpointLoader_1 = require('../MicrosoftPowerpoint/PowerpointLoader')
const utils_1 = require('../../../src/utils')
const validator_1 = require('../../../src/validator')
class Folder_DocumentLoaders {
    constructor() {
        this.label = 'Folder with Files'
        this.name = 'folderFiles'
        this.version = 4.0
        this.type = 'Document'
        this.icon = 'folder.svg'
        this.category = 'Document Loaders'
        this.description = `Load data from folder with multiple files`
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Folder Path',
                name: 'folderPath',
                type: 'string',
                placeholder: ''
            },
            {
                label: 'Recursive',
                name: 'recursive',
                type: 'boolean',
                additionalParams: false
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Pdf Usage',
                name: 'pdfUsage',
                type: 'options',
                description: 'Only when loading PDF files',
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
                label: 'JSONL Pointer Extraction',
                name: 'pointerName',
                type: 'string',
                description: 'Only when loading JSONL files',
                placeholder: '<pointerName>',
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
                description:
                    'Each document loader comes with a default set of metadata keys that are extracted from the document. You can use this field to omit some of the default metadata keys. The value should be a list of keys, seperated by comma. Use * to omit all metadata keys execept the ones you specify in the Additional Metadata field',
                placeholder: 'key1, key2, key3.nestedKey1',
                optional: true,
                additionalParams: true
            }
        ]
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
        ]
    }
    async init(nodeData) {
        const textSplitter = nodeData.inputs?.textSplitter
        const folderPath = nodeData.inputs?.folderPath
        const metadata = nodeData.inputs?.metadata
        const recursive = nodeData.inputs?.recursive
        const pdfUsage = nodeData.inputs?.pdfUsage
        const pointerName = nodeData.inputs?.pointerName
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys
        const output = nodeData.outputs?.output
        if (!folderPath) {
            throw new Error('Folder path is required')
        }
        if ((0, validator_1.isPathTraversal)(folderPath)) {
            throw new Error('Invalid folder path: Path traversal detected. Please provide a safe folder path.')
        }
        let omitMetadataKeys = []
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim())
        }
        const loader = new directory_1.DirectoryLoader(
            folderPath,
            {
                '.json': (path) => new json_1.JSONLoader(path),
                '.jsonl': (blob) => new json_1.JSONLinesLoader(blob, '/' + pointerName.trim()),
                '.txt': (path) => new text_1.TextLoader(path),
                '.csv': (path) => new csv_1.CSVLoader(path),
                '.xls': (path) => new ExcelLoader_1.LoadOfSheet(path),
                '.xlsx': (path) => new ExcelLoader_1.LoadOfSheet(path),
                '.xlsm': (path) => new ExcelLoader_1.LoadOfSheet(path),
                '.xlsb': (path) => new ExcelLoader_1.LoadOfSheet(path),
                '.doc': (path) => new docx_1.DocxLoader(path),
                '.docx': (path) => new docx_1.DocxLoader(path),
                '.ppt': (path) => new PowerpointLoader_1.PowerpointLoader(path),
                '.pptx': (path) => new PowerpointLoader_1.PowerpointLoader(path),
                '.pdf': (path) =>
                    pdfUsage === 'perFile'
                        ? // @ts-ignore
                          new pdf_1.PDFLoader(path, {
                              splitPages: false,
                              pdfjs: () =>
                                  Promise.resolve().then(() => __importStar(require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js')))
                          })
                        : // @ts-ignore
                          new pdf_1.PDFLoader(path, {
                              pdfjs: () =>
                                  Promise.resolve().then(() => __importStar(require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js')))
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
            },
            recursive
        )
        let docs = []
        if (textSplitter) {
            docs = await loader.load()
            docs = await textSplitter.splitDocuments(docs)
        } else {
            docs = await loader.load()
        }
        if (metadata) {
            const parsedMetadata = typeof metadata === 'object' ? metadata : JSON.parse(metadata)
            docs = docs.map((doc) => ({
                ...doc,
                metadata:
                    _omitMetadataKeys === '*'
                        ? {
                              ...parsedMetadata
                          }
                        : (0, lodash_1.omit)(
                              {
                                  ...doc.metadata,
                                  ...parsedMetadata
                              },
                              omitMetadataKeys
                          )
            }))
        } else {
            docs = docs.map((doc) => ({
                ...doc,
                metadata:
                    _omitMetadataKeys === '*'
                        ? {}
                        : (0, lodash_1.omit)(
                              {
                                  ...doc.metadata
                              },
                              omitMetadataKeys
                          )
            }))
        }
        if (output === 'document') {
            return docs
        } else {
            let finaltext = ''
            for (const doc of docs) {
                finaltext += `${doc.pageContent}\n`
            }
            return (0, utils_1.handleEscapeCharacters)(finaltext, false)
        }
    }
}
module.exports = { nodeClass: Folder_DocumentLoaders }
//# sourceMappingURL=Folder.js.map
