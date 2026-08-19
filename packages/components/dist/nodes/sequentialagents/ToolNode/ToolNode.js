"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const messages_1 = require("@langchain/core/messages");
const agents_1 = require("../../../src/agents");
const commonUtils_1 = require("../commonUtils");
const utils_1 = require("../../../src/utils");
const prompts_1 = require("@langchain/core/prompts");
const defaultApprovalPrompt = `You are about to execute tool: {tools}. Ask if user want to proceed`;
const customOutputFuncDesc = `This is only applicable when you have a custom State at the START node. After tool execution, you might want to update the State values`;
const howToUseCode = `
1. Return the key value JSON object. For example: if you have the following State:
    \`\`\`json
    {
        "user": null
    }
    \`\`\`

    You can update the "user" value by returning the following:
    \`\`\`js
    return {
        "user": "john doe"
    }
    \`\`\`

2. If you want to use the tool's output as the value to update state, it is available as \`$flow.output\` with the following structure (array):
    \`\`\`json
    [
        {
            "tool": "tool's name",
            "toolInput": {},
            "toolOutput": "tool's output content",
            "sourceDocuments": [
                {
                    "pageContent": "This is the page content",
                    "metadata": "{foo: var}"
                }
            ]
        }
    ]
    \`\`\`

    For example:
    \`\`\`js
    /* Assuming you have the following state:
    {
        "sources": null
    }
    */
    
    return {
        "sources": $flow.output[0].toolOutput
    }
    \`\`\`

3. You can also get default flow config, including the current "state":
    - \`$flow.sessionId\`
    - \`$flow.chatId\`
    - \`$flow.chatflowId\`
    - \`$flow.input\`
    - \`$flow.state\`

4. You can get custom variables: \`$vars.<variable-name>\`

`;
const howToUse = `
1. Key and value pair to be updated. For example: if you have the following State:
    | Key       | Operation     | Default Value     |
    |-----------|---------------|-------------------|
    | user      | Replace       |                   |

    You can update the "user" value with the following:
    | Key       | Value     |
    |-----------|-----------|
    | user      | john doe  |

2. If you want to use the Tool Node's output as the value to update state, it is available as available as \`$flow.output\` with the following structure (array):
    \`\`\`json
    [
        {
            "tool": "tool's name",
            "toolInput": {},
            "toolOutput": "tool's output content",
            "sourceDocuments": [
                {
                    "pageContent": "This is the page content",
                    "metadata": "{foo: var}"
                }
            ]
        }
    ]
    \`\`\`

    For example:
    | Key          | Value                                     |
    |--------------|-------------------------------------------|
    | sources      | \`$flow.output[0].toolOutput\`       |

3. You can get default flow config, including the current "state":
    - \`$flow.sessionId\`
    - \`$flow.chatId\`
    - \`$flow.chatflowId\`
    - \`$flow.input\`
    - \`$flow.state\`

4. You can get custom variables: \`$vars.<variable-name>\`

`;
const defaultFunc = `const result = $flow.output;

/* Suppose we have a custom State schema like this:
* {
    aggregate: {
        value: (x, y) => x.concat(y),
        default: () => []
    }
  }
*/

return {
  aggregate: [result.content]
};`;
const TAB_IDENTIFIER = 'selectedUpdateStateMemoryTab';
class ToolNode_SeqAgents {
    constructor() {
        this.label = 'Tool Node';
        this.name = 'seqToolNode';
        this.version = 2.1;
        this.type = 'ToolNode';
        this.icon = 'toolNode.svg';
        this.category = 'Sequential Agents';
        this.description = `Execute tool and return tool's output`;
        this.baseClasses = [this.type];
        this.documentation = 'https://docs.flowiseai.com/using-flowise/agentflows/sequential-agents#id-6.-tool-node';
        this.inputs = [
            {
                label: 'Tools',
                name: 'tools',
                type: 'Tool',
                list: true,
                optional: true
            },
            {
                label: 'LLM Node',
                name: 'llmNode',
                type: 'LLMNode'
            },
            {
                label: 'Name',
                name: 'toolNodeName',
                type: 'string',
                placeholder: 'Tool'
            },
            {
                label: 'Require Approval',
                name: 'interrupt',
                description: 'Require approval before executing tools',
                type: 'boolean',
                optional: true
            },
            {
                label: 'Approval Prompt',
                name: 'approvalPrompt',
                description: 'Prompt for approval. Only applicable if "Require Approval" is enabled',
                type: 'string',
                default: defaultApprovalPrompt,
                rows: 4,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Approve Button Text',
                name: 'approveButtonText',
                description: 'Text for approve button. Only applicable if "Require Approval" is enabled',
                type: 'string',
                default: 'Yes',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Reject Button Text',
                name: 'rejectButtonText',
                description: 'Text for reject button. Only applicable if "Require Approval" is enabled',
                type: 'string',
                default: 'No',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Update State',
                name: 'updateStateMemory',
                type: 'tabs',
                tabIdentifier: TAB_IDENTIFIER,
                additionalParams: true,
                default: 'updateStateMemoryUI',
                tabs: [
                    {
                        label: 'Update State (Table)',
                        name: 'updateStateMemoryUI',
                        type: 'datagrid',
                        hint: {
                            label: 'How to use',
                            value: howToUse
                        },
                        description: customOutputFuncDesc,
                        datagrid: [
                            {
                                field: 'key',
                                headerName: 'Key',
                                type: 'asyncSingleSelect',
                                loadMethod: 'loadStateKeys',
                                flex: 0.5,
                                editable: true
                            },
                            {
                                field: 'value',
                                headerName: 'Value',
                                type: 'freeSolo',
                                valueOptions: [
                                    {
                                        label: 'All Tools Output (array)',
                                        value: '$flow.output'
                                    },
                                    {
                                        label: 'First Tool Output (string)',
                                        value: '$flow.output[0].toolOutput'
                                    },
                                    {
                                        label: 'First Tool Input Arguments (string | json)',
                                        value: '$flow.output[0].toolInput'
                                    },
                                    {
                                        label: `First Tool Returned Source Documents (array)`,
                                        value: '$flow.output[0].sourceDocuments'
                                    },
                                    {
                                        label: `Global variable (string)`,
                                        value: '$vars.<variable-name>'
                                    },
                                    {
                                        label: 'Input Question (string)',
                                        value: '$flow.input'
                                    },
                                    {
                                        label: 'Session Id (string)',
                                        value: '$flow.sessionId'
                                    },
                                    {
                                        label: 'Chat Id (string)',
                                        value: '$flow.chatId'
                                    },
                                    {
                                        label: 'Chatflow Id (string)',
                                        value: '$flow.chatflowId'
                                    }
                                ],
                                editable: true,
                                flex: 1
                            }
                        ],
                        optional: true,
                        additionalParams: true
                    },
                    {
                        label: 'Update State (Code)',
                        name: 'updateStateMemoryCode',
                        type: 'code',
                        hint: {
                            label: 'How to use',
                            value: howToUseCode
                        },
                        description: `${customOutputFuncDesc}. Must return an object representing the state`,
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
        const toolNodeLabel = nodeData.inputs?.toolNodeName;
        const llmNode = nodeData.inputs?.llmNode;
        if (!llmNode)
            throw new Error('Tool node must have a predecessor!');
        const interrupt = nodeData.inputs?.interrupt;
        const approvalPrompt = nodeData.inputs?.approvalPrompt;
        const approveButtonText = nodeData.inputs?.approveButtonText;
        const rejectButtonText = nodeData.inputs?.rejectButtonText;
        let tools = nodeData.inputs?.tools;
        tools = (0, lodash_1.flatten)(tools);
        if (!tools || !tools.length)
            throw new Error('Tools must not be empty');
        const output = nodeData.outputs?.output;
        if (!toolNodeLabel)
            throw new Error('Tool node name is required!');
        const toolNodeLabelName = toolNodeLabel.toLowerCase().replace(/\s/g, '_').trim();
        const toolNode = new ToolNode(tools, nodeData, input, options, toolNodeLabelName, [], { sequentialNodeName: toolNodeLabelName });
        toolNode.interrupt = interrupt;
        if (interrupt && approvalPrompt && approveButtonText && rejectButtonText) {
            ;
            toolNode.seekPermissionMessage = async (usedTools) => {
                const prompt = prompts_1.ChatPromptTemplate.fromMessages([['human', approvalPrompt || defaultApprovalPrompt]]);
                const chain = prompt.pipe(llmNode.startLLM);
                const response = (await chain.invoke({
                    input: 'Hello there!',
                    tools: JSON.stringify(usedTools)
                }));
                return response.content;
            };
        }
        const returnOutput = {
            id: nodeData.id,
            node: toolNode,
            name: toolNodeLabelName,
            label: toolNodeLabel,
            type: 'tool',
            output,
            predecessorAgents: [llmNode],
            llm: llmNode.llm,
            startLLM: llmNode.startLLM,
            moderations: llmNode.moderations,
            multiModalMessageContent: llmNode.multiModalMessageContent
        };
        return returnOutput;
    }
}
class ToolNode extends commonUtils_1.RunnableCallable {
    constructor(tools, nodeData, inputQuery, options, name = 'tools', tags = [], metadata = {}) {
        super({ name, metadata, tags, func: (input, config) => this.run(input, config) });
        this.tools = tools;
        this.nodeData = nodeData;
        this.inputQuery = inputQuery;
        this.options = options;
    }
    async run(input, config) {
        let messages;
        // Check if input is an array of BaseMessage[]
        if (Array.isArray(input)) {
            messages = input;
        }
        // Check if input is IStateWithMessages
        else if (input.messages) {
            messages = input.messages;
        }
        // Handle MessagesState type
        else {
            messages = input.messages;
        }
        // Get the last message
        const message = messages[messages.length - 1];
        if (message._getType() !== 'ai') {
            throw new Error('ToolNode only accepts AIMessages as input.');
        }
        // Extract all properties except messages for IStateWithMessages
        const { messages: _, ...inputWithoutMessages } = Array.isArray(input) ? { messages: input } : input;
        const ChannelsWithoutMessages = {
            chatId: this.options.chatId,
            sessionId: this.options.sessionId,
            input: this.inputQuery,
            state: inputWithoutMessages
        };
        const outputs = await Promise.all(message.tool_calls?.map(async (call) => {
            const tool = this.tools.find((tool) => tool.name === call.name);
            if (tool === undefined) {
                throw new Error(`Tool ${call.name} not found.`);
            }
            if (tool && tool.setFlowObject) {
                // @ts-ignore
                tool.setFlowObject(ChannelsWithoutMessages);
            }
            let output = await tool.invoke(call.args, config);
            let sourceDocuments = [];
            let artifacts = [];
            if (output?.includes(agents_1.SOURCE_DOCUMENTS_PREFIX)) {
                const outputArray = output.split(agents_1.SOURCE_DOCUMENTS_PREFIX);
                output = outputArray[0];
                const docs = outputArray[1];
                try {
                    sourceDocuments = JSON.parse(docs);
                }
                catch (e) {
                    console.error('Error parsing source documents from tool');
                }
            }
            if (output?.includes(agents_1.ARTIFACTS_PREFIX)) {
                const outputArray = output.split(agents_1.ARTIFACTS_PREFIX);
                output = outputArray[0];
                try {
                    artifacts = JSON.parse(outputArray[1]);
                }
                catch (e) {
                    console.error('Error parsing artifacts from tool');
                }
            }
            let toolInput;
            if (typeof output === 'string' && output.includes(agents_1.TOOL_ARGS_PREFIX)) {
                const outputArray = output.split(agents_1.TOOL_ARGS_PREFIX);
                output = outputArray[0];
                try {
                    toolInput = JSON.parse(outputArray[1]);
                }
                catch (e) {
                    console.error('Error parsing tool input from tool');
                }
            }
            return new messages_1.ToolMessage({
                name: tool.name,
                content: typeof output === 'string' ? output : JSON.stringify(output),
                tool_call_id: call.id,
                additional_kwargs: {
                    sourceDocuments,
                    artifacts,
                    args: toolInput ?? call.args,
                    usedTools: [
                        {
                            tool: tool.name ?? '',
                            toolInput: toolInput ?? call.args,
                            toolOutput: output
                        }
                    ]
                }
            });
        }) ?? []);
        const additional_kwargs = { nodeId: this.nodeData.id };
        outputs.forEach((result) => (result.additional_kwargs = { ...result.additional_kwargs, ...additional_kwargs }));
        if (this.nodeData.inputs?.updateStateMemoryUI || this.nodeData.inputs?.updateStateMemoryCode) {
            const returnedOutput = await getReturnOutput(this.nodeData, this.inputQuery, this.options, outputs, input);
            return {
                ...returnedOutput,
                messages: outputs
            };
        }
        else {
            return Array.isArray(input) ? outputs : { messages: outputs };
        }
    }
}
const getReturnOutput = async (nodeData, input, options, outputs, state) => {
    const appDataSource = options.appDataSource;
    const databaseEntities = options.databaseEntities;
    const tabIdentifier = nodeData.inputs?.[`${TAB_IDENTIFIER}_${nodeData.id}`];
    const updateStateMemoryUI = nodeData.inputs?.updateStateMemoryUI;
    const updateStateMemoryCode = nodeData.inputs?.updateStateMemoryCode;
    const updateStateMemory = nodeData.inputs?.updateStateMemory;
    const selectedTab = tabIdentifier ? tabIdentifier.split(`_${nodeData.id}`)[0] : 'updateStateMemoryUI';
    const variables = await (0, utils_1.getVars)(appDataSource, databaseEntities, nodeData, options);
    const reformattedOutput = outputs.map((output) => {
        return {
            tool: output.name,
            toolInput: output.additional_kwargs.args,
            toolOutput: output.content,
            sourceDocuments: output.additional_kwargs.sourceDocuments,
            artifacts: output.additional_kwargs.artifacts
        };
    });
    const flow = {
        chatflowId: options.chatflowid,
        sessionId: options.sessionId,
        chatId: options.chatId,
        input,
        output: reformattedOutput,
        state,
        vars: (0, utils_1.prepareSandboxVars)(variables)
    };
    if (updateStateMemory && updateStateMemory !== 'updateStateMemoryUI' && updateStateMemory !== 'updateStateMemoryCode') {
        try {
            const parsedSchema = typeof updateStateMemory === 'string' ? JSON.parse(updateStateMemory) : updateStateMemory;
            const obj = {};
            for (const sch of parsedSchema) {
                const key = sch.Key;
                if (!key)
                    throw new Error(`Key is required`);
                let value = sch.Value;
                if (value.startsWith('$flow')) {
                    value = (0, commonUtils_1.customGet)(flow, sch.Value.replace('$flow.', ''));
                }
                else if (value.startsWith('$vars')) {
                    value = (0, commonUtils_1.customGet)(flow, sch.Value.replace('$', ''));
                }
                obj[key] = value;
            }
            return obj;
        }
        catch (e) {
            throw new Error(e);
        }
    }
    if (selectedTab === 'updateStateMemoryUI' && updateStateMemoryUI) {
        try {
            const parsedSchema = typeof updateStateMemoryUI === 'string' ? JSON.parse(updateStateMemoryUI) : updateStateMemoryUI;
            const obj = {};
            for (const sch of parsedSchema) {
                const key = sch.key;
                if (!key)
                    throw new Error(`Key is required`);
                let value = sch.value;
                if (value.startsWith('$flow')) {
                    value = (0, commonUtils_1.customGet)(flow, sch.value.replace('$flow.', ''));
                }
                else if (value.startsWith('$vars')) {
                    value = (0, commonUtils_1.customGet)(flow, sch.value.replace('$', ''));
                }
                obj[key] = value;
            }
            return obj;
        }
        catch (e) {
            throw new Error(e);
        }
    }
    else if (selectedTab === 'updateStateMemoryCode' && updateStateMemoryCode) {
        const sandbox = (0, utils_1.createCodeExecutionSandbox)(input, variables, flow);
        try {
            const response = await (0, utils_1.executeJavaScriptCode)(updateStateMemoryCode, sandbox);
            if (typeof response !== 'object')
                throw new Error('Return output must be an object');
            return response;
        }
        catch (e) {
            throw new Error(e);
        }
    }
};
module.exports = { nodeClass: ToolNode_SeqAgents };
//# sourceMappingURL=ToolNode.js.map