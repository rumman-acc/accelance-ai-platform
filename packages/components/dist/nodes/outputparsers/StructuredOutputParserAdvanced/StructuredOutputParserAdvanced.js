'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const src_1 = require('../../../src')
const output_parsers_1 = require('@langchain/core/output_parsers')
const output_parsers_2 = require('@langchain/core/output_parsers')
const OutputParserHelpers_1 = require('../OutputParserHelpers')
const jsonrepair_1 = require('jsonrepair')
const secureZodParser_1 = require('../../../src/secureZodParser')
class AdvancedStructuredOutputParser {
    constructor() {
        this.label = 'Advanced Structured Output Parser'
        this.name = 'advancedStructuredOutputParser'
        this.version = 1.0
        this.type = 'AdvancedStructuredOutputParser'
        this.description = 'Parse the output of an LLM call into a given structure by providing a Zod schema.'
        this.icon = 'structure.svg'
        this.category = OutputParserHelpers_1.CATEGORY
        this.baseClasses = [this.type, ...(0, src_1.getBaseClasses)(output_parsers_1.BaseOutputParser)]
        this.inputs = [
            {
                label: 'Autofix',
                name: 'autofixParser',
                type: 'boolean',
                optional: true,
                description: 'In the event that the first call fails, will make another call to the model to fix any errors.'
            },
            {
                label: 'Example JSON',
                name: 'exampleJson',
                type: 'string',
                description: 'Zod schema for the output of the model',
                rows: 10,
                default: `z.object({
    title: z.string(), // Title of the movie as a string
    yearOfRelease: z.number().int(), // Release year as an integer number,
    genres: z.enum([
        "Action", "Comedy", "Drama", "Fantasy", "Horror",
        "Mystery", "Romance", "Science Fiction", "Thriller", "Documentary"
    ]).array().max(2), // Array of genres, max of 2 from the defined enum
    shortDescription: z.string().max(500) // Short description, max 500 characters
})`
            }
        ]
    }
    async init(nodeData) {
        const schemaString = nodeData.inputs?.exampleJson
        const autoFix = nodeData.inputs?.autofixParser
        try {
            const zodSchema = secureZodParser_1.SecureZodSchemaParser.parseZodSchema(schemaString)
            const structuredOutputParser = output_parsers_2.StructuredOutputParser.fromZodSchema(zodSchema)
            const baseParse = structuredOutputParser.parse
            // Fix broken JSON from LLM
            structuredOutputParser.parse = (text) => {
                const jsonString = text.includes('```') ? text.trim().split(/```(?:json)?/)[1] : text.trim()
                return baseParse.call(structuredOutputParser, (0, jsonrepair_1.jsonrepair)(jsonString))
            }
            // NOTE: When we change Flowise to return a json response, the following has to be changed to: JsonStructuredOutputParser
            Object.defineProperty(structuredOutputParser, 'autoFix', {
                enumerable: true,
                configurable: true,
                writable: true,
                value: autoFix
            })
            return structuredOutputParser
        } catch (exception) {
            throw new Error('Error parsing Zod Schema: ' + exception)
        }
    }
}
module.exports = { nodeClass: AdvancedStructuredOutputParser }
//# sourceMappingURL=StructuredOutputParserAdvanced.js.map
