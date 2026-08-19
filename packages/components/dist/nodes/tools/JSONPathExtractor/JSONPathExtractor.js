'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const v3_1 = require('zod/v3')
const tools_1 = require('@langchain/core/tools')
const utils_1 = require('../../../src/utils')
const lodash_1 = require('lodash')
/**
 * Tool that extracts values from JSON using path
 */
class JSONPathExtractorTool extends tools_1.StructuredTool {
    constructor(path, returnNullOnError = false) {
        super()
        this.name = 'json_path_extractor'
        this.description = 'Extract value from JSON using configured path'
        this.schema = v3_1.z.object({
            json: v3_1.z
                .union([
                    v3_1.z.string().describe('JSON string'),
                    v3_1.z.record(v3_1.z.any()).describe('JSON object'),
                    v3_1.z.array(v3_1.z.any()).describe('JSON array')
                ])
                .describe('JSON data to extract value from')
        })
        this.path = path
        this.returnNullOnError = returnNullOnError
    }
    async _call({ json }) {
        // Validate that path is configured
        if (!this.path) {
            if (this.returnNullOnError) {
                return 'null'
            }
            throw new Error('No extraction path configured')
        }
        let data
        // Parse JSON string if needed
        if (typeof json === 'string') {
            try {
                data = JSON.parse(json)
            } catch (error) {
                if (this.returnNullOnError) {
                    return 'null'
                }
                throw new Error(`Invalid JSON string: ${error instanceof Error ? error.message : 'Parse error'}`)
            }
        } else {
            data = json
        }
        // Extract value using lodash get
        const value = (0, lodash_1.get)(data, this.path)
        if (value === undefined) {
            if (this.returnNullOnError) {
                return 'null'
            }
            const jsonPreview = JSON.stringify(data, null, 2)
            const preview = jsonPreview.length > 200 ? jsonPreview.substring(0, 200) + '...' : jsonPreview
            throw new Error(`Path "${this.path}" not found in JSON. Received: ${preview}`)
        }
        return typeof value === 'string' ? value : JSON.stringify(value)
    }
}
/**
 * Node implementation for JSON Path Extractor tool
 */
class JSONPathExtractor_Tools {
    constructor() {
        this.label = 'JSON Path Extractor'
        this.name = 'jsonPathExtractor'
        this.version = 1.0
        this.type = 'JSONPathExtractor'
        this.icon = 'jsonpathextractor.svg'
        this.category = 'Tools'
        this.description = 'Extract values from JSON using path expressions'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(JSONPathExtractorTool)]
        this.inputs = [
            {
                label: 'JSON Path',
                name: 'path',
                type: 'string',
                description: 'Path to extract. Examples: data, user.name, items[0].id',
                placeholder: 'data'
            },
            {
                label: 'Return Null on Error',
                name: 'returnNullOnError',
                type: 'boolean',
                default: false,
                description: 'Return null instead of throwing error when extraction fails',
                optional: true,
                additionalParams: true
            }
        ]
    }
    async init(nodeData, _) {
        const path = nodeData.inputs?.path || ''
        const returnNullOnError = nodeData.inputs?.returnNullOnError || false
        if (!path) {
            throw new Error('JSON Path is required')
        }
        return new JSONPathExtractorTool(path, returnNullOnError)
    }
}
module.exports = { nodeClass: JSONPathExtractor_Tools }
//# sourceMappingURL=JSONPathExtractor.js.map
