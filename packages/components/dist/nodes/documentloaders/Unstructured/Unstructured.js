'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.UnstructuredLoader = void 0
const base_1 = require('@langchain/classic/document_loaders/base')
const documents_1 = require('@langchain/core/documents')
class UnstructuredLoader extends base_1.BaseDocumentLoader {
    constructor(optionsOrLegacyFilePath) {
        super()
        this.apiUrl = process.env.UNSTRUCTURED_API_URL || 'https://api.unstructuredapp.io/general/v0/general'
        this.apiKey = process.env.UNSTRUCTURED_API_KEY
        this.strategy = 'hi_res'
        this.ocrLanguages = []
        const options = optionsOrLegacyFilePath
        this.apiKey = options.apiKey
        this.apiUrl = options.apiUrl || this.apiUrl
        this.strategy = options.strategy || this.strategy
        this.encoding = options.encoding
        this.ocrLanguages = options.ocrLanguages || this.ocrLanguages
        this.coordinates = options.coordinates
        this.pdfInferTableStructure = options.pdfInferTableStructure
        this.xmlKeepTags = options.xmlKeepTags
        this.skipInferTableTypes = options.skipInferTableTypes
        this.hiResModelName = options.hiResModelName
        this.includePageBreaks = options.includePageBreaks
        this.chunkingStrategy = options.chunkingStrategy
        this.multiPageSections = options.multiPageSections
        this.combineUnderNChars = options.combineUnderNChars
        this.newAfterNChars = options.newAfterNChars
        this.maxCharacters = options.maxCharacters
    }
    async _partition(buffer, fileName) {
        const formData = new FormData()
        formData.append('files', new Blob([new Uint8Array(buffer)]), fileName)
        formData.append('strategy', this.strategy)
        this.ocrLanguages.forEach((language) => {
            formData.append('ocr_languages', language)
        })
        if (this.encoding) {
            formData.append('encoding', this.encoding)
        }
        if (this.coordinates === true) {
            formData.append('coordinates', 'true')
        }
        if (this.pdfInferTableStructure === true) {
            formData.append('pdf_infer_table_structure', 'true')
        }
        if (this.xmlKeepTags === true) {
            formData.append('xml_keep_tags', 'true')
        }
        if (this.skipInferTableTypes) {
            formData.append('skip_infer_table_types', JSON.stringify(this.skipInferTableTypes))
        }
        if (this.hiResModelName) {
            formData.append('hi_res_model_name', this.hiResModelName)
        }
        if (this.includePageBreaks) {
            formData.append('include_page_breaks', 'true')
        }
        if (this.chunkingStrategy) {
            formData.append('chunking_strategy', this.chunkingStrategy)
        }
        if (this.multiPageSections !== undefined) {
            formData.append('multipage_sections', this.multiPageSections ? 'true' : 'false')
        }
        if (this.combineUnderNChars !== undefined) {
            formData.append('combine_under_n_chars', String(this.combineUnderNChars))
        }
        if (this.newAfterNChars !== undefined) {
            formData.append('new_after_n_chars', String(this.newAfterNChars))
        }
        if (this.maxCharacters !== undefined) {
            formData.append('max_characters', String(this.maxCharacters))
        }
        const headers = {
            'UNSTRUCTURED-API-KEY': this.apiKey || ''
        }
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            body: formData,
            headers
        })
        if (!response.ok) {
            throw new Error(`Failed to partition file with error ${response.status} and message ${await response.text()}`)
        }
        const elements = await response.json()
        if (!Array.isArray(elements)) {
            throw new Error(`Expected partitioning request to return an array, but got ${elements}`)
        }
        return elements.filter((el) => typeof el.text === 'string')
    }
    async loadAndSplitBuffer(buffer, fileName) {
        const elements = await this._partition(buffer, fileName)
        const documents = []
        for (const element of elements) {
            const { metadata, text } = element
            if (typeof text === 'string') {
                documents.push(
                    new documents_1.Document({
                        pageContent: text,
                        metadata: {
                            ...metadata,
                            category: element.type
                        }
                    })
                )
            }
        }
        return documents
    }
    async load() {
        return Promise.reject(new Error('load() is not supported for UnstructuredLoader. Use loadAndSplitBuffer() instead.'))
    }
}
exports.UnstructuredLoader = UnstructuredLoader
//# sourceMappingURL=Unstructured.js.map
