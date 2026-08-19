'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const textsplitters_1 = require('@langchain/textsplitters')
const extraLanguageSeparators = {
    c: [
        '\nstruct ',
        '\nunion ',
        '\nenum ',
        '\nvoid ',
        '\nint ',
        '\nfloat ',
        '\ndouble ',
        '\nif ',
        '\nfor ',
        '\nwhile ',
        '\nswitch ',
        '\ncase ',
        '\n\n',
        '\n',
        ' ',
        ''
    ],
    csharp: [
        '\nnamespace ',
        '\ninterface ',
        '\nenum ',
        '\nstruct ',
        '\ndelegate ',
        '\nevent ',
        '\nclass ',
        '\nabstract ',
        '\npublic ',
        '\nprotected ',
        '\nprivate ',
        '\nstatic ',
        '\nreturn ',
        '\nif ',
        '\ncontinue ',
        '\nfor ',
        '\nforeach ',
        '\nwhile ',
        '\nswitch ',
        '\nbreak ',
        '\ncase ',
        '\nelse ',
        '\ntry ',
        '\nthrow ',
        '\nfinally ',
        '\ncatch ',
        '\n\n',
        '\n',
        ' ',
        ''
    ],
    cobol: [
        '\nIDENTIFICATION DIVISION.',
        '\nENVIRONMENT DIVISION.',
        '\nDATA DIVISION.',
        '\nPROCEDURE DIVISION.',
        '\nWORKING-STORAGE SECTION.',
        '\nLINKAGE SECTION.',
        '\nFILE SECTION.',
        '\nINPUT-OUTPUT SECTION.',
        '\nOPEN ',
        '\nCLOSE ',
        '\nREAD ',
        '\nWRITE ',
        '\nIF ',
        '\nELSE ',
        '\nMOVE ',
        '\nPERFORM ',
        '\nUNTIL ',
        '\nVARYING ',
        '\nACCEPT ',
        '\nDISPLAY ',
        '\nSTOP RUN.',
        '\n',
        ' ',
        ''
    ],
    elixir: [
        '\ndef ',
        '\ndefp ',
        '\ndefmodule ',
        '\ndefprotocol ',
        '\ndefmacro ',
        '\ndefmacrop ',
        '\nif ',
        '\nunless ',
        '\ncase ',
        '\ncond ',
        '\nwith ',
        '\nfor ',
        '\ndo ',
        '\n\n',
        '\n',
        ' ',
        ''
    ],
    haskell: [
        '\nmain :: ',
        '\nmain = ',
        '\nlet ',
        '\nin ',
        '\ndo ',
        '\nwhere ',
        '\n:: ',
        '\n= ',
        '\ndata ',
        '\nnewtype ',
        '\ntype ',
        '\nmodule ',
        '\nimport ',
        '\nqualified ',
        '\nimport qualified ',
        '\nclass ',
        '\ninstance ',
        '\ncase ',
        '\n| ',
        '\n= {',
        '\n, ',
        '\n\n',
        '\n',
        ' ',
        ''
    ],
    kotlin: [
        '\nclass ',
        '\npublic ',
        '\nprotected ',
        '\nprivate ',
        '\ninternal ',
        '\ncompanion ',
        '\nfun ',
        '\nval ',
        '\nvar ',
        '\nif ',
        '\nfor ',
        '\nwhile ',
        '\nwhen ',
        '\nelse ',
        '\n\n',
        '\n',
        ' ',
        ''
    ],
    lua: ['\nlocal ', '\nfunction ', '\nif ', '\nfor ', '\nwhile ', '\nrepeat ', '\n\n', '\n', ' ', ''],
    powershell: [
        '\nfunction ',
        '\nparam ',
        '\nif ',
        '\nforeach ',
        '\nfor ',
        '\nwhile ',
        '\nswitch ',
        '\nclass ',
        '\ntry ',
        '\ncatch ',
        '\nfinally ',
        '\n\n',
        '\n',
        ' ',
        ''
    ],
    ts: [
        '\nenum ',
        '\ninterface ',
        '\nnamespace ',
        '\ntype ',
        '\nclass ',
        '\nfunction ',
        '\nconst ',
        '\nlet ',
        '\nvar ',
        '\nif ',
        '\nfor ',
        '\nwhile ',
        '\nswitch ',
        '\ncase ',
        '\ndefault ',
        '\n\n',
        '\n',
        ' ',
        ''
    ]
}
class CodeTextSplitter_TextSplitters {
    constructor() {
        this.label = 'Code Text Splitter'
        this.name = 'codeTextSplitter'
        this.version = 1.0
        this.type = 'CodeTextSplitter'
        this.icon = 'codeTextSplitter.svg'
        this.category = 'Text Splitters'
        this.description = `Split documents based on language-specific syntax`
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(textsplitters_1.RecursiveCharacterTextSplitter)]
        this.inputs = [
            {
                label: 'Language',
                name: 'language',
                type: 'options',
                options: [
                    {
                        label: 'c',
                        name: 'c'
                    },
                    {
                        label: 'cobol',
                        name: 'cobol'
                    },
                    {
                        label: 'cpp',
                        name: 'cpp'
                    },
                    {
                        label: 'csharp',
                        name: 'csharp'
                    },
                    {
                        label: 'elixir',
                        name: 'elixir'
                    },
                    {
                        label: 'go',
                        name: 'go'
                    },
                    {
                        label: 'haskell',
                        name: 'haskell'
                    },
                    {
                        label: 'html',
                        name: 'html'
                    },
                    {
                        label: 'java',
                        name: 'java'
                    },
                    {
                        label: 'js',
                        name: 'js'
                    },
                    {
                        label: 'kotlin',
                        name: 'kotlin'
                    },
                    {
                        label: 'latex',
                        name: 'latex'
                    },
                    {
                        label: 'lua',
                        name: 'lua'
                    },
                    {
                        label: 'markdown',
                        name: 'markdown'
                    },
                    {
                        label: 'php',
                        name: 'php'
                    },
                    {
                        label: 'powershell',
                        name: 'powershell'
                    },
                    {
                        label: 'proto',
                        name: 'proto'
                    },
                    {
                        label: 'python',
                        name: 'python'
                    },
                    {
                        label: 'rst',
                        name: 'rst'
                    },
                    {
                        label: 'ruby',
                        name: 'ruby'
                    },
                    {
                        label: 'rust',
                        name: 'rust'
                    },
                    {
                        label: 'scala',
                        name: 'scala'
                    },
                    {
                        label: 'sol',
                        name: 'sol'
                    },
                    {
                        label: 'swift',
                        name: 'swift'
                    },
                    {
                        label: 'ts',
                        name: 'ts'
                    }
                ]
            },
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
            }
        ]
    }
    async init(nodeData) {
        const chunkSize = nodeData.inputs?.chunkSize
        const chunkOverlap = nodeData.inputs?.chunkOverlap
        const language = nodeData.inputs?.language
        const obj = {}
        if (chunkSize) obj.chunkSize = parseInt(chunkSize, 10)
        if (chunkOverlap) obj.chunkOverlap = parseInt(chunkOverlap, 10)
        if (textsplitters_1.SupportedTextSplitterLanguages.includes(language)) {
            return textsplitters_1.RecursiveCharacterTextSplitter.fromLanguage(language, obj)
        }
        const separators = extraLanguageSeparators[language]
        if (separators) {
            return new textsplitters_1.RecursiveCharacterTextSplitter({ ...obj, separators })
        }
        return new textsplitters_1.RecursiveCharacterTextSplitter(obj)
    }
}
module.exports = { nodeClass: CodeTextSplitter_TextSplitters }
//# sourceMappingURL=CodeTextSplitter.js.map
