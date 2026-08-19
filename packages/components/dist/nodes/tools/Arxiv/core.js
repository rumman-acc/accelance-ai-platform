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
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod }
    }
Object.defineProperty(exports, '__esModule', { value: true })
exports.ArxivTool = exports.desc = void 0
const v3_1 = require('zod/v3')
const node_fetch_1 = __importDefault(require('node-fetch'))
const pdf_1 = require('@langchain/community/document_loaders/fs/pdf')
const core_1 = require('../OpenAPIToolkit/core')
exports.desc = `Use this tool to search for academic papers on Arxiv. You can search by keywords, topics, authors, or specific Arxiv IDs. The tool can return either paper summaries or download and extract full paper content.`
// Schema for Arxiv search
const createArxivSchema = () => {
    return v3_1.z.object({
        query: v3_1.z
            .string()
            .describe('Search query for Arxiv papers. Can be keywords, topics, authors, or specific Arxiv IDs (e.g., 2301.12345)')
    })
}
class ArxivTool extends core_1.DynamicStructuredTool {
    constructor(args, logger, orgId) {
        const schema = createArxivSchema()
        const toolInput = {
            name: args?.name || 'arxiv_search',
            description: args?.description || exports.desc,
            schema: schema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super(toolInput)
        this.topKResults = 3
        this.maxQueryLength = 300
        this.docContentCharsMax = 4000
        this.loadFullContent = false
        this.continueOnFailure = false
        this.legacyBuild = false
        this.topKResults = args?.topKResults ?? this.topKResults
        this.maxQueryLength = args?.maxQueryLength ?? this.maxQueryLength
        this.docContentCharsMax = args?.docContentCharsMax ?? this.docContentCharsMax
        this.loadFullContent = args?.loadFullContent ?? this.loadFullContent
        this.continueOnFailure = args?.continueOnFailure ?? this.continueOnFailure
        this.legacyBuild = args?.legacyBuild ?? this.legacyBuild
        this.logger = logger
        this.orgId = orgId
    }
    isArxivIdentifier(query) {
        const arxivIdentifierPattern = /\d{2}(0[1-9]|1[0-2])\.\d{4,5}(v\d+|)|\d{7}.*/
        const queryItems = query.substring(0, this.maxQueryLength).split(/\s+/)
        for (const queryItem of queryItems) {
            const match = queryItem.match(arxivIdentifierPattern)
            if (!match || match[0] !== queryItem) {
                return false
            }
        }
        return true
    }
    parseArxivResponse(xmlText) {
        const results = []
        // Simple XML parsing for Arxiv API response
        const entryRegex = /<entry>(.*?)<\/entry>/gs
        const entries = xmlText.match(entryRegex) || []
        for (const entry of entries) {
            try {
                const id = this.extractXmlValue(entry, 'id')
                const title = this.extractXmlValue(entry, 'title')?.replace(/\n\s+/g, ' ').trim()
                const summary = this.extractXmlValue(entry, 'summary')?.replace(/\n\s+/g, ' ').trim()
                const published = this.extractXmlValue(entry, 'published')
                const updated = this.extractXmlValue(entry, 'updated')
                // Extract authors
                const authorRegex = /<author><name>(.*?)<\/name><\/author>/g
                const authors = []
                let authorMatch
                while ((authorMatch = authorRegex.exec(entry)) !== null) {
                    authors.push(authorMatch[1])
                }
                if (id && title && summary) {
                    results.push({
                        id,
                        title,
                        authors,
                        summary,
                        published: published || '',
                        updated: updated || '',
                        entryId: id
                    })
                }
            } catch (error) {
                console.warn('Error parsing Arxiv entry:', error)
            }
        }
        return results
    }
    extractXmlValue(xml, tag) {
        const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 's')
        const match = xml.match(regex)
        return match ? match[1] : undefined
    }
    async fetchResults(query) {
        const baseUrl = 'http://export.arxiv.org/api/query'
        let searchParams
        if (this.isArxivIdentifier(query)) {
            // Search by ID
            const ids = query.split(/\s+/).join(',')
            searchParams = new URLSearchParams({
                id_list: ids,
                max_results: this.topKResults.toString()
            })
        } else {
            // Search by query
            // Remove problematic characters that can cause search issues
            const cleanedQuery = query.replace(/[:-]/g, '').substring(0, this.maxQueryLength)
            searchParams = new URLSearchParams({
                search_query: `all:${cleanedQuery}`,
                max_results: this.topKResults.toString(),
                sortBy: 'relevance',
                sortOrder: 'descending'
            })
        }
        const url = `${baseUrl}?${searchParams.toString()}`
        this.logger?.info(`[${this.orgId}]: Making Arxiv API call to: ${url}`)
        const response = await (0, node_fetch_1.default)(url)
        if (!response.ok) {
            throw new Error(`Arxiv API error: ${response.status} ${response.statusText}`)
        }
        const xmlText = await response.text()
        return this.parseArxivResponse(xmlText)
    }
    async downloadAndExtractPdf(arxivId) {
        // Extract clean arxiv ID from full URL if needed
        const cleanId = arxivId.replace('http://arxiv.org/abs/', '').replace('https://arxiv.org/abs/', '')
        const pdfUrl = `https://arxiv.org/pdf/${cleanId}.pdf`
        this.logger?.info(`[${this.orgId}]: Downloading PDF from: ${pdfUrl}`)
        const response = await (0, node_fetch_1.default)(pdfUrl)
        if (!response.ok) {
            throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`)
        }
        // Get PDF buffer and create blob
        const buffer = await response.buffer()
        const blob = new Blob([new Uint8Array(buffer)])
        // Use PDFLoader to extract text (same as Pdf.ts)
        const loader = new pdf_1.PDFLoader(blob, {
            splitPages: false,
            pdfjs: () =>
                // @ts-ignore
                this.legacyBuild
                    ? Promise.resolve().then(() => __importStar(require('pdfjs-dist/legacy/build/pdf.js')))
                    : Promise.resolve().then(() => __importStar(require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js')))
        })
        const docs = await loader.load()
        return docs.map((doc) => doc.pageContent).join('\n')
    }
    /** @ignore */
    async _call(arg) {
        const { query } = arg
        if (!query) {
            throw new Error('Query is required for Arxiv search')
        }
        try {
            const results = await this.fetchResults(query)
            if (results.length === 0) {
                return 'No good Arxiv Result was found'
            }
            if (!this.loadFullContent) {
                // Return summaries only (original behavior)
                const docs = results.map((result) => {
                    const publishedDate = result.published ? new Date(result.published).toISOString().split('T')[0] : 'Unknown'
                    return `Published: ${publishedDate}\nTitle: ${result.title}\nAuthors: ${result.authors.join(', ')}\nSummary: ${
                        result.summary
                    }`
                })
                const fullText = docs.join('\n\n')
                return this.docContentCharsMax ? fullText.substring(0, this.docContentCharsMax) : fullText
            } else {
                // Download PDFs and extract full content
                const docs = []
                for (const result of results) {
                    try {
                        this.logger?.info(`[${this.orgId}]: Processing paper: ${result.title}`)
                        // Download and extract PDF content
                        const fullText = await this.downloadAndExtractPdf(result.id)
                        const publishedDate = result.published ? new Date(result.published).toISOString().split('T')[0] : 'Unknown'
                        // Format with metadata and full content
                        const docContent = `Published: ${publishedDate}\nTitle: ${result.title}\nAuthors: ${result.authors.join(
                            ', '
                        )}\nSummary: ${result.summary}\n\nFull Content:\n${fullText}`
                        const truncatedContent = this.docContentCharsMax ? docContent.substring(0, this.docContentCharsMax) : docContent
                        docs.push(truncatedContent)
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                        console.error(`Error processing paper ${result.title}:`, errorMessage)
                        if (!this.continueOnFailure) {
                            throw new Error(`Failed to process paper "${result.title}": ${errorMessage}`)
                        } else {
                            // Add error notice and continue with summary only
                            const publishedDate = result.published ? new Date(result.published).toISOString().split('T')[0] : 'Unknown'
                            const fallbackContent = `Published: ${publishedDate}\nTitle: ${result.title}\nAuthors: ${result.authors.join(
                                ', '
                            )}\nSummary: ${result.summary}\n\n[ERROR: Could not load full content - ${errorMessage}]`
                            docs.push(fallbackContent)
                        }
                    }
                }
                return docs.join('\n\n---\n\n')
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.error('Arxiv search error:', errorMessage)
            throw new Error(`Failed to search Arxiv: ${errorMessage}`)
        }
    }
}
exports.ArxivTool = ArxivTool
//# sourceMappingURL=core.js.map
