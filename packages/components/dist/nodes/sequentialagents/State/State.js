"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const langgraph_1 = require("@langchain/langgraph");
const utils_1 = require("../../../src/utils");
const defaultFunc = `{
    aggregate: {
        value: (x, y) => x.concat(y), // here we append the new message to the existing messages
        default: () => []
    },
    replacedValue: {
        value: (x, y) => y ?? x,
        default: () => null
    }
}`;
const howToUse = `
Specify the Key, Operation Type, and Default Value for the state object. The Operation Type can be either "Replace" or "Append".

**Replace**
- Replace the existing value with the new value.
- If the new value is null, the existing value will be retained.

**Append**
- Append the new value to the existing value.
- Default value can be empty or an array. Ex: ["a", "b"]
- Final value is an array.
`;
const TAB_IDENTIFIER = 'selectedStateTab';
class State_SeqAgents {
    constructor() {
        this.label = 'State';
        this.name = 'seqState';
        this.version = 2.0;
        this.type = 'State';
        this.icon = 'state.svg';
        this.category = 'Sequential Agents';
        this.description = 'A centralized state object, updated by nodes in the graph, passing from one node to another';
        this.baseClasses = [this.type];
        this.documentation = 'https://docs.flowiseai.com/using-flowise/agentflows/sequential-agents#id-3.-state-node';
        this.inputs = [
            {
                label: 'Custom State',
                name: 'stateMemory',
                type: 'tabs',
                tabIdentifier: TAB_IDENTIFIER,
                additionalParams: true,
                default: 'stateMemoryUI',
                tabs: [
                    {
                        label: 'Custom State (Table)',
                        name: 'stateMemoryUI',
                        type: 'datagrid',
                        description: 'Structure for state. By default, state contains "messages" that got updated with each message sent and received.',
                        hint: {
                            label: 'How to use',
                            value: howToUse
                        },
                        datagrid: [
                            { field: 'key', headerName: 'Key', editable: true },
                            {
                                field: 'type',
                                headerName: 'Operation',
                                type: 'singleSelect',
                                valueOptions: ['Replace', 'Append'],
                                editable: true
                            },
                            { field: 'defaultValue', headerName: 'Default Value', flex: 1, editable: true }
                        ],
                        optional: true,
                        additionalParams: true
                    },
                    {
                        label: 'Custom State (Code)',
                        name: 'stateMemoryCode',
                        type: 'code',
                        description: `JSON object representing the state`,
                        hideCodeExecute: true,
                        codeExample: defaultFunc,
                        optional: true,
                        additionalParams: true
                    }
                ]
            }
        ];
    }
    async init(nodeData, input, options) {
        const tabIdentifier = nodeData.inputs?.[`${TAB_IDENTIFIER}_${nodeData.id}`];
        const stateMemoryUI = nodeData.inputs?.stateMemoryUI;
        const stateMemoryCode = nodeData.inputs?.stateMemoryCode;
        const appDataSource = options.appDataSource;
        const databaseEntities = options.databaseEntities;
        const selectedTab = tabIdentifier ? tabIdentifier.split(`_${nodeData.id}`)[0] : 'stateMemoryUI';
        const stateMemory = nodeData.inputs?.stateMemory;
        if (stateMemory && stateMemory !== 'stateMemoryUI' && stateMemory !== 'stateMemoryCode') {
            try {
                const parsedSchemaFromUI = typeof stateMemoryUI === 'string' ? JSON.parse(stateMemoryUI) : stateMemoryUI;
                const parsedSchema = typeof stateMemory === 'string' ? JSON.parse(stateMemory) : stateMemory;
                const combinedMemorySchema = [...parsedSchemaFromUI, ...parsedSchema];
                const obj = {};
                for (const sch of combinedMemorySchema) {
                    const key = sch.Key ?? sch.key;
                    if (!key)
                        throw new Error(`Key is required`);
                    const type = sch.Operation ?? sch.type;
                    const defaultValue = sch['Default Value'] ?? sch.defaultValue;
                    if (type === 'Append') {
                        obj[key] = {
                            value: (x, y) => (Array.isArray(y) ? x.concat(y) : x.concat([y])),
                            default: () => (defaultValue ? JSON.parse(defaultValue) : [])
                        };
                    }
                    else {
                        obj[key] = {
                            value: (x, y) => y ?? x,
                            default: () => defaultValue
                        };
                    }
                }
                const returnOutput = {
                    id: nodeData.id,
                    node: obj,
                    name: 'state',
                    label: 'state',
                    type: 'state',
                    output: langgraph_1.START
                };
                return returnOutput;
            }
            catch (e) {
                throw new Error(e);
            }
        }
        if (!stateMemoryUI && !stateMemoryCode) {
            const returnOutput = {
                id: nodeData.id,
                node: {},
                name: 'state',
                label: 'state',
                type: 'state',
                output: langgraph_1.START
            };
            return returnOutput;
        }
        if (selectedTab === 'stateMemoryUI' && stateMemoryUI) {
            try {
                const parsedSchema = typeof stateMemoryUI === 'string' ? JSON.parse(stateMemoryUI) : stateMemoryUI;
                const obj = {};
                for (const sch of parsedSchema) {
                    const key = sch.key;
                    if (!key)
                        throw new Error(`Key is required`);
                    const type = sch.type;
                    const defaultValue = sch.defaultValue;
                    if (type === 'Append') {
                        obj[key] = {
                            value: (x, y) => (Array.isArray(y) ? x.concat(y) : x.concat([y])),
                            default: () => (defaultValue ? JSON.parse(defaultValue) : [])
                        };
                    }
                    else {
                        obj[key] = {
                            value: (x, y) => y ?? x,
                            default: () => defaultValue
                        };
                    }
                }
                const returnOutput = {
                    id: nodeData.id,
                    node: obj,
                    name: 'state',
                    label: 'state',
                    type: 'state',
                    output: langgraph_1.START
                };
                return returnOutput;
            }
            catch (e) {
                throw new Error(e);
            }
        }
        else if (selectedTab === 'stateMemoryCode' && stateMemoryCode) {
            const variables = await (0, utils_1.getVars)(appDataSource, databaseEntities, nodeData, options);
            const flow = {
                chatflowId: options.chatflowid,
                sessionId: options.sessionId,
                chatId: options.chatId,
                input
            };
            const sandbox = (0, utils_1.createCodeExecutionSandbox)('', variables, flow);
            try {
                const response = await (0, utils_1.executeJavaScriptCode)(`return ${stateMemoryCode}`, sandbox);
                if (typeof response !== 'object')
                    throw new Error('State must be an object');
                const returnOutput = {
                    id: nodeData.id,
                    node: response,
                    name: 'state',
                    label: 'state',
                    type: 'state',
                    output: langgraph_1.START
                };
                return returnOutput;
            }
            catch (e) {
                throw new Error(e);
            }
        }
    }
}
module.exports = { nodeClass: State_SeqAgents };
//# sourceMappingURL=State.js.map