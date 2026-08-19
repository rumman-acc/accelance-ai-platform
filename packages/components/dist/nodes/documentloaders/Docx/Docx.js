'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const lodash_1 = require('lodash')
const docx_1 = require('@langchain/community/document_loaders/fs/docx')
const src_1 = require('../../../src')
class Docx_DocumentLoaders {
    constructor() {
        this.label = 'Docx File'
        this.name = 'docxFile'
        this.version = 2.0
        this.type = 'Document'
        this.icon = 'docx.svg'
        this.category = 'Document Loaders'
        this.description = `Load data from DOCX files`
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Docx File',
                name: 'docxFile',
                type: 'file',
                fileType: '.docx'
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
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
    async init(nodeData, _, options) {
        const textSplitter = nodeData.inputs?.textSplitter
        const docxFileBase64 = nodeData.inputs?.docxFile
        const metadata = nodeData.inputs?.metadata
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys
        const output = nodeData.outputs?.output
        let omitMetadataKeys = []
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim())
        }
        let docs = []
        let files = []
        if (docxFileBase64.startsWith('FILE-STORAGE::')) {
            const fileName = docxFileBase64.replace('FILE-STORAGE::', '')
            if (fileName.startsWith('[') && fileName.endsWith(']')) {
                files = JSON.parse(fileName)
            } else {
                files = [fileName]
            }
            const orgId = options.orgId
            const chatflowid = options.chatflowid
            for (const file of files) {
                if (!file) continue
                const fileData = await (0, src_1.getFileFromStorage)(file, orgId, chatflowid)
                const blob = new Blob([new Uint8Array(fileData)])
                const loader = new docx_1.DocxLoader(blob)
                if (textSplitter) {
                    let splittedDocs = await loader.load()
                    splittedDocs = await textSplitter.splitDocuments(splittedDocs)
                    docs.push(...splittedDocs)
                } else {
                    docs.push(...(await loader.load()))
                }
            }
        } else {
            if (docxFileBase64.startsWith('[') && docxFileBase64.endsWith(']')) {
                files = JSON.parse(docxFileBase64)
            } else {
                files = [docxFileBase64]
            }
            for (const file of files) {
                if (!file) continue
                const splitDataURI = file.split(',')
                splitDataURI.pop()
                const bf = Buffer.from(splitDataURI.pop() || '', 'base64')
                const blob = new Blob([bf])
                const loader = new docx_1.DocxLoader(blob)
                if (textSplitter) {
                    let splittedDocs = await loader.load()
                    splittedDocs = await textSplitter.splitDocuments(splittedDocs)
                    docs.push(...splittedDocs)
                } else {
                    docs.push(...(await loader.load()))
                }
            }
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
            return (0, src_1.handleEscapeCharacters)(finaltext, false)
        }
    }
}
module.exports = { nodeClass: Docx_DocumentLoaders }
//# sourceMappingURL=Docx.js.map
