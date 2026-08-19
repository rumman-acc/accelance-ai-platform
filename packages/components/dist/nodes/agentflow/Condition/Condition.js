'use strict'
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod }
    }
Object.defineProperty(exports, '__esModule', { value: true })
const remove_markdown_1 = __importDefault(require('remove-markdown'))
/**
 * Unescapes a regex pattern that was escaped by Flowise input handling.
 * Flowise escapes these characters: \ → \\, [ → \[, ] → \], * → \*
 * We reverse this to get the user's intended regex pattern.
 */
const unescapeRegexPattern = (escaped) => {
    return escaped
        .replace(/\\\\/g, '\0') // Preserve intentional backslashes
        .replace(/\\([[\]*])/g, '$1') // Unescape only: [ ] *
        .replace(/\0/g, '\\') // Restore preserved backslashes
}
class Condition_Agentflow {
    constructor() {
        this.label = 'Condition'
        this.name = 'conditionAgentflow'
        this.version = 1.0
        this.type = 'Condition'
        this.category = 'Agent Flows'
        this.description = `Split flows based on If Else conditions`
        this.baseClasses = [this.type]
        this.color = '#FFB938'
        this.inputs = [
            {
                label: 'Conditions',
                name: 'conditions',
                type: 'array',
                description: 'Values to compare',
                acceptVariable: true,
                default: [
                    {
                        type: 'string',
                        value1: '',
                        operation: 'equal',
                        value2: ''
                    }
                ],
                array: [
                    {
                        label: 'Type',
                        name: 'type',
                        type: 'options',
                        options: [
                            {
                                label: 'String',
                                name: 'string'
                            },
                            {
                                label: 'Number',
                                name: 'number'
                            },
                            {
                                label: 'Boolean',
                                name: 'boolean'
                            }
                        ],
                        default: 'string'
                    },
                    /////////////////////////////////////// STRING ////////////////////////////////////////
                    {
                        label: 'Value 1',
                        name: 'value1',
                        type: 'string',
                        default: '',
                        description: 'First value to be compared with',
                        acceptVariable: true,
                        show: {
                            'conditions[$index].type': 'string'
                        }
                    },
                    {
                        label: 'Operation',
                        name: 'operation',
                        type: 'options',
                        options: [
                            {
                                label: 'Contains',
                                name: 'contains'
                            },
                            {
                                label: 'Ends With',
                                name: 'endsWith'
                            },
                            {
                                label: 'Equal',
                                name: 'equal'
                            },
                            {
                                label: 'Not Contains',
                                name: 'notContains'
                            },
                            {
                                label: 'Not Equal',
                                name: 'notEqual'
                            },
                            {
                                label: 'Regex',
                                name: 'regex'
                            },
                            {
                                label: 'Starts With',
                                name: 'startsWith'
                            },
                            {
                                label: 'Is Empty',
                                name: 'isEmpty'
                            },
                            {
                                label: 'Not Empty',
                                name: 'notEmpty'
                            }
                        ],
                        default: 'equal',
                        description: 'Type of operation',
                        show: {
                            'conditions[$index].type': 'string'
                        }
                    },
                    {
                        label: 'Value 2',
                        name: 'value2',
                        type: 'string',
                        default: '',
                        description: 'Second value to be compared with',
                        acceptVariable: true,
                        show: {
                            'conditions[$index].type': 'string'
                        },
                        hide: {
                            'conditions[$index].operation': ['isEmpty', 'notEmpty']
                        }
                    },
                    /////////////////////////////////////// NUMBER ////////////////////////////////////////
                    {
                        label: 'Value 1',
                        name: 'value1',
                        type: 'number',
                        default: '',
                        description: 'First value to be compared with',
                        acceptVariable: true,
                        show: {
                            'conditions[$index].type': 'number'
                        }
                    },
                    {
                        label: 'Operation',
                        name: 'operation',
                        type: 'options',
                        options: [
                            {
                                label: 'Smaller',
                                name: 'smaller'
                            },
                            {
                                label: 'Smaller Equal',
                                name: 'smallerEqual'
                            },
                            {
                                label: 'Equal',
                                name: 'equal'
                            },
                            {
                                label: 'Not Equal',
                                name: 'notEqual'
                            },
                            {
                                label: 'Larger',
                                name: 'larger'
                            },
                            {
                                label: 'Larger Equal',
                                name: 'largerEqual'
                            },
                            {
                                label: 'Is Empty',
                                name: 'isEmpty'
                            },
                            {
                                label: 'Not Empty',
                                name: 'notEmpty'
                            }
                        ],
                        default: 'equal',
                        description: 'Type of operation',
                        show: {
                            'conditions[$index].type': 'number'
                        }
                    },
                    {
                        label: 'Value 2',
                        name: 'value2',
                        type: 'number',
                        default: 0,
                        description: 'Second value to be compared with',
                        acceptVariable: true,
                        show: {
                            'conditions[$index].type': 'number'
                        }
                    },
                    /////////////////////////////////////// BOOLEAN ////////////////////////////////////////
                    {
                        label: 'Value 1',
                        name: 'value1',
                        type: 'boolean',
                        default: false,
                        description: 'First value to be compared with',
                        show: {
                            'conditions[$index].type': 'boolean'
                        }
                    },
                    {
                        label: 'Operation',
                        name: 'operation',
                        type: 'options',
                        options: [
                            {
                                label: 'Equal',
                                name: 'equal'
                            },
                            {
                                label: 'Not Equal',
                                name: 'notEqual'
                            }
                        ],
                        default: 'equal',
                        description: 'Type of operation',
                        show: {
                            'conditions[$index].type': 'boolean'
                        }
                    },
                    {
                        label: 'Value 2',
                        name: 'value2',
                        type: 'boolean',
                        default: false,
                        description: 'Second value to be compared with',
                        show: {
                            'conditions[$index].type': 'boolean'
                        }
                    }
                ]
            }
        ]
        this.outputs = [
            {
                label: '0',
                name: '0',
                description: 'Condition 0'
            },
            {
                label: '1',
                name: '1',
                description: 'Else'
            }
        ]
    }
    async run(nodeData, _, options) {
        const state = options.agentflowRuntime?.state
        const compareOperationFunctions = {
            contains: (value1, value2) => (value1 || '').toString().includes((value2 || '').toString()),
            notContains: (value1, value2) => !(value1 || '').toString().includes((value2 || '').toString()),
            endsWith: (value1, value2) => value1.endsWith(value2),
            equal: (value1, value2) => value1 === value2,
            notEqual: (value1, value2) => value1 !== value2,
            larger: (value1, value2) => (Number(value1) || 0) > (Number(value2) || 0),
            largerEqual: (value1, value2) => (Number(value1) || 0) >= (Number(value2) || 0),
            smaller: (value1, value2) => (Number(value1) || 0) < (Number(value2) || 0),
            smallerEqual: (value1, value2) => (Number(value1) || 0) <= (Number(value2) || 0),
            startsWith: (value1, value2) => value1.startsWith(value2),
            regex: (value1, value2) => {
                try {
                    const pattern = unescapeRegexPattern((value2 || '').toString())
                    return new RegExp(pattern).test((value1 || '').toString())
                } catch {
                    return false
                }
            },
            isEmpty: (value1) => [undefined, null, ''].includes(value1),
            notEmpty: (value1) => ![undefined, null, ''].includes(value1)
        }
        const _conditions = nodeData.inputs?.conditions
        const conditions = typeof _conditions === 'string' ? JSON.parse(_conditions) : _conditions
        const initialConditions = { ...conditions }
        for (const condition of conditions) {
            const _value1 = condition.value1
            const _value2 = condition.value2
            const operation = condition.operation
            let value1
            let value2
            switch (condition.type) {
                case 'boolean':
                    value1 = _value1
                    value2 = _value2
                    break
                case 'number':
                    value1 = parseFloat(_value1) || 0
                    value2 = parseFloat(_value2) || 0
                    break
                default: // string
                    value1 = (0, remove_markdown_1.default)(_value1 || '')
                    value2 = (0, remove_markdown_1.default)(_value2 || '')
            }
            const compareOperationResult = compareOperationFunctions[operation](value1, value2)
            if (compareOperationResult) {
                // find the matching condition
                const conditionIndex = conditions.findIndex((c) => JSON.stringify(c) === JSON.stringify(condition))
                // add isFulfilled to the condition
                if (conditionIndex > -1) {
                    conditions[conditionIndex] = { ...condition, isFulfilled: true }
                }
                break
            }
        }
        // If no condition is fulfilled, add isFulfilled to the ELSE condition
        const dummyElseConditionData = {
            type: 'string',
            value1: '',
            operation: 'equal',
            value2: ''
        }
        if (!conditions.some((c) => c.isFulfilled)) {
            conditions.push({
                ...dummyElseConditionData,
                isFulfilled: true
            })
        } else {
            conditions.push({
                ...dummyElseConditionData,
                isFulfilled: false
            })
        }
        const returnOutput = {
            id: nodeData.id,
            name: this.name,
            input: { conditions: initialConditions },
            output: { conditions },
            state
        }
        return returnOutput
    }
}
module.exports = { nodeClass: Condition_Agentflow }
//# sourceMappingURL=Condition.js.map
