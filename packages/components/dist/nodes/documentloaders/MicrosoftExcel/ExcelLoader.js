'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.LoadOfSheet = void 0
const buffer_1 = require('@langchain/classic/document_loaders/fs/buffer')
const xlsx_1 = require('xlsx')
/**
 * Document loader that uses SheetJS to load documents.
 *
 * Each worksheet is parsed into an array of row objects using the SheetJS
 * `sheet_to_json` method and projected to a `Document`. Metadata includes
 * original sheet name, row data, and row index
 */
class LoadOfSheet extends buffer_1.BufferLoader {
    constructor(filePathOrBlob) {
        super(filePathOrBlob)
        this.attributes = []
        this.attributes = []
    }
    /**
     * Parse document
     *
     * NOTE: column labels in multiple sheets are not disambiguated!
     *
     * @param raw Raw data Buffer
     * @param metadata Document metadata
     * @returns Array of Documents
     */
    async parse(raw, metadata) {
        const result = []
        this.attributes = [
            { name: 'worksheet', description: 'Sheet or Worksheet Name', type: 'string' },
            { name: 'rowNum', description: 'Row index', type: 'number' }
        ]
        const wb = (0, xlsx_1.read)(raw, { type: 'buffer' })
        for (let name of wb.SheetNames) {
            const fields = {}
            const ws = wb.Sheets[name]
            if (!ws) continue
            const aoo = xlsx_1.utils.sheet_to_json(ws)
            aoo.forEach((row) => {
                result.push({
                    pageContent:
                        Object.entries(row)
                            .map((kv) => `- ${kv[0]}: ${kv[1]}`)
                            .join('\n') + '\n',
                    metadata: {
                        worksheet: name,
                        rowNum: row['__rowNum__'],
                        ...metadata,
                        ...row
                    }
                })
                Object.entries(row).forEach(([k, v]) => {
                    if (v != null) (fields[k] || (fields[k] = {}))[v instanceof Date ? 'date' : typeof v] = true
                })
            })
            Object.entries(fields).forEach(([k, v]) =>
                this.attributes.push({
                    name: k,
                    description: k,
                    type: Object.keys(v).join(' or ')
                })
            )
        }
        return result
    }
}
exports.LoadOfSheet = LoadOfSheet
//# sourceMappingURL=ExcelLoader.js.map
