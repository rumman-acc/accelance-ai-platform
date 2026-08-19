'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const textsplitters_1 = require('@langchain/textsplitters')
class CharacterTextSplitter_TextSplitters {
    constructor() {
        this.label = 'Character Text Splitter'
        this.name = 'characterTextSplitter'
        this.version = 1.0
        this.type = 'CharacterTextSplitter'
        this.icon = 'textsplitter.svg'
        this.category = 'Text Splitters'
        this.description = `splits only on one type of character (defaults to "\\n\\n").`
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(textsplitters_1.CharacterTextSplitter)]
        this.inputs = [
            {
                label: 'Chunk Size',
                name: 'chunkSize',
                type: 'number',
                description: 'Number of characters in each chunk. Default is 1000.',
                default: 1000,
                optional: true
            },
            {
                label: 'Chunk Overlap',
                name: 'chunkOverlap',
                type: 'number',
                description: 'Number of characters to overlap between chunks. Default is 200.',
                default: 200,
                optional: true
            },
            {
                label: 'Custom Separator',
                name: 'separator',
                type: 'string',
                placeholder: `" "`,
                description: 'Separator to determine when to split the text, will override the default separator',
                optional: true
            }
        ]
    }
    async init(nodeData) {
        const separator = nodeData.inputs?.separator
        const chunkSize = nodeData.inputs?.chunkSize
        const chunkOverlap = nodeData.inputs?.chunkOverlap
        const obj = {}
        if (separator) obj.separator = separator
        if (chunkSize) obj.chunkSize = parseInt(chunkSize, 10)
        if (chunkOverlap) obj.chunkOverlap = parseInt(chunkOverlap, 10)
        const splitter = new textsplitters_1.CharacterTextSplitter(obj)
        return splitter
    }
}
module.exports = { nodeClass: CharacterTextSplitter_TextSplitters }
//# sourceMappingURL=CharacterTextSplitter.js.map
