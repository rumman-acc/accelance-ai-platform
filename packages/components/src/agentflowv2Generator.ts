import { ICommonObject } from './Interface'
import { z } from 'zod/v3'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { isEqual, get, cloneDeep } from 'lodash'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { extractResponseContent } from './utils'
import { isWriteCapableToolNode } from './toolActionRisk'

const ToolType = z.array(z.string()).describe('List of tools')

// Key AgentFlow V2's dynamic model/tool config objects use to hold a selected credential id
// (see Tool.ts: `selectedToolConfig['FLOWISE_CREDENTIAL_ID']`, and the llmModelConfig shape
// built in generateSelectedTools/validateAndRepairFlow below).
const FLOWISE_CREDENTIAL_ID_KEY = 'FLOWISE_CREDENTIAL_ID'

// Define a more specific NodePosition schema
const NodePositionType = z.object({
    x: z.number().describe('X coordinate of the node position'),
    y: z.number().describe('Y coordinate of the node position')
})

// Define a more specific EdgeData schema
const EdgeDataType = z.object({
    edgeLabel: z.string().optional().describe('Label for the edge')
})

// Define a basic NodeData schema to avoid using .passthrough() which might cause issues
const NodeDataType = z
    .object({
        label: z.string().optional().describe('Label for the node'),
        name: z.string().optional().describe('Name of the node')
    })
    .optional()

const NodeType = z.object({
    id: z.string().describe('Unique identifier for the node'),
    type: z.enum(['agentFlow']).describe('Type of the node'),
    position: NodePositionType.describe('Position of the node in the UI'),
    width: z.number().describe('Width of the node'),
    height: z.number().describe('Height of the node'),
    selected: z.boolean().optional().describe('Whether the node is selected'),
    positionAbsolute: NodePositionType.optional().describe('Absolute position of the node'),
    data: NodeDataType
})

const EdgeType = z.object({
    id: z.string().describe('Unique identifier for the edge'),
    type: z.enum(['agentFlow']).describe('Type of the node'),
    source: z.string().describe('ID of the source node'),
    sourceHandle: z.string().describe('ID of the source handle'),
    target: z.string().describe('ID of the target node'),
    targetHandle: z.string().describe('ID of the target handle'),
    data: EdgeDataType.optional().describe('Data associated with the edge')
})

const NodesEdgesType = z
    .object({
        description: z.string().optional().describe('Description of the workflow'),
        usecases: z.array(z.string()).optional().describe('Use cases for this workflow'),
        nodes: z.array(NodeType).describe('Array of nodes in the workflow'),
        edges: z.array(EdgeType).describe('Array of edges connecting the nodes')
    })
    .describe('Generate Agentflowv2 nodes and edges')

interface NodePosition {
    x: number
    y: number
}

interface EdgeData {
    edgeLabel?: string
    sourceColor?: string
    targetColor?: string
    isHumanInput?: boolean
}

interface AgentToolConfig {
    agentSelectedTool: string
    agentSelectedToolConfig: {
        agentSelectedTool: string
    }
}

interface NodeInputs {
    agentTools?: AgentToolConfig[]
    toolAgentflowSelectedTool?: string
    toolInputArgs?: Record<string, any>[]
    toolAgentflowSelectedToolConfig?: {
        toolAgentflowSelectedTool: string
    }
    [key: string]: any
}

interface NodeData {
    label?: string
    name?: string
    id?: string
    inputs?: NodeInputs
    inputAnchors?: InputAnchor[]
    inputParams?: InputParam[]
    outputs?: Record<string, any>
    outputAnchors?: OutputAnchor[]
    credential?: string
    color?: string
    [key: string]: any
}

interface Node {
    id: string
    type: 'agentFlow' | 'iteration'
    position: NodePosition
    width: number
    height: number
    selected?: boolean
    positionAbsolute?: NodePosition
    data: NodeData
    parentNode?: string
    extent?: string
}

interface Edge {
    id: string
    type: 'agentFlow'
    source: string
    sourceHandle: string
    target: string
    targetHandle: string
    data?: EdgeData
    label?: string
}

interface InputAnchor {
    id: string
    label: string
    name: string
    type?: string
    [key: string]: any
}

interface InputParam {
    id: string
    name: string
    label?: string
    type?: string
    display?: boolean
    show?: Record<string, any>
    hide?: Record<string, any>
    [key: string]: any
}

interface OutputAnchor {
    id: string
    label: string
    name: string
}

export const generateAgentflowv2 = async (config: Record<string, any>, question: string, options: ICommonObject) => {
    try {
        const result = await generateNodesEdges(config, question, options)

        const { nodes, edges } = generateNodesData(result, config)

        const updatedNodes = await generateSelectedTools(nodes, edges, config, question, options)

        const updatedEdges = updateEdges(edges, nodes)

        const warnings = validateAndRepairFlow(updatedNodes, updatedEdges, config)

        return { nodes: updatedNodes, edges: updatedEdges, ...(warnings.length > 0 ? { warnings } : {}) }
    } catch (error) {
        console.error('Error generating AgentflowV2:', error)
        return { error: error.message || 'Unknown error occurred' }
    }
}

/**
 * Deterministic post-generation safety net -- catches what prompt engineering (generateNodesEdges,
 * generateSelectedTools) doesn't reliably get right on its own:
 * 1. Forces every agentAgentflow/llmAgentflow node onto the model+credential the user picked to
 *    generate this flow with (config.selectedChatModel) -- unconditionally. Not a repair for a
 *    missing value; a deliberate consistency rule, since the generating LLM is otherwise free to
 *    put a different provider on different nodes.
 * 2. Flags a toolAgentflow node whose bound tool doesn't match what its proposing agent
 *    selected -- a backstop for findProposingAgentTools()'s reuse logic above, independent of
 *    whether that logic covers every graph shape.
 * 3. Flags the whole flow if it binds any write-capable tool (per toolActionRisk's naming-based
 *    classifier) but contains no humanInputAgentflow node anywhere -- a coarse, whole-flow check
 *    by design: a precise per-path "is this specific call gated" analysis would need to track
 *    which branches actually lead to a mutating call, which the tool-binding data at generation
 *    time doesn't distinguish (an agent's tool binding exposes all of a tool's actions, not just
 *    the read-only ones, even when its own role is meant to be read-only or propose-only). This
 *    whole-flow check is intentionally coarse to avoid false-flagging a correctly-built
 * 4. Lists every bound tool that declares a credential field but has none set -- true for
 *    essentially every tool node the generator creates, since initNode() unconditionally clears
 *    credential (see below). Surfaced as one combined warning so the caller (UI) can tell the
 *    user exactly what still needs configuring, rather than the generated flow silently failing
 *    the first time a tool actually runs.
 *    propose/approve/execute flow (whose read and propose agents legitimately have write-capable
 *    tools bound without being preceded by a gate themselves) while still catching the case with
 *    no safety structure anywhere.
 */
export const validateAndRepairFlow = (nodes: Node[], edges: Edge[], config: Record<string, any>): string[] => {
    const warnings: string[] = []

    // 1. Force every agentAgentflow/llmAgentflow node onto the exact model+credential the user
    // picked to generate this flow with (config.selectedChatModel) -- unconditionally, not just
    // when empty. The phase-1 LLM is free to put a different provider on different nodes (seen
    // in practice: it once picked Gemini for one node while the user had selected Anthropic in
    // the generation dialog), which is surprising and not what "the model I picked to build this"
    // implies. This is a deliberate consistency choice, not a bug repair, so it doesn't warn.
    const selectedChatModel = config.selectedChatModel as { name?: string; inputs?: Record<string, any> } | undefined
    if (selectedChatModel?.name) {
        for (const node of nodes) {
            const modelField = node.data.name === 'agentAgentflow' ? 'agentModel' : node.data.name === 'llmAgentflow' ? 'llmModel' : null
            if (!modelField) continue
            if (!node.data.inputs) node.data.inputs = {}
            node.data.inputs[modelField] = selectedChatModel.name
            node.data.inputs[`${modelField}Config`] = {
                ...(selectedChatModel.inputs || {}),
                [modelField]: selectedChatModel.name
            }
        }
    } else {
        // No selectedChatModel to fall back on at all -- this shouldn't happen (the route
        // requires it), but if a node still ends up modelless, that's worth surfacing rather
        // than shipping a silently broken node.
        for (const node of nodes) {
            const modelField = node.data.name === 'agentAgentflow' ? 'agentModel' : node.data.name === 'llmAgentflow' ? 'llmModel' : null
            if (modelField && !node.data.inputs?.[modelField]) {
                warnings.push(`"${node.data.label || node.id}" has no model selected and none was available to default to.`)
            }
        }
    }

    // 2. toolAgentflow-vs-proposing-agent consistency backstop.
    for (const node of nodes) {
        if (node.data.name !== 'toolAgentflow') continue
        const proposingTools = findProposingAgentTools(node, nodes, edges)
        const boundTool = node.data.inputs?.toolAgentflowSelectedTool
        if (proposingTools.length > 0 && boundTool && !proposingTools.includes(boundTool)) {
            warnings.push(
                `"${
                    node.data.label || node.id
                }" executes tool "${boundTool}", which doesn't match the tool(s) its proposing agent selected (${proposingTools.join(
                    ', '
                )}) -- verify this is intentional.`
            )
        }
    }

    // 3 & 4. Whole-flow checks: any HITL gate at all, and which bound tools still need a
    // credential picked (every tool node the generator creates comes out with credential
    // cleared -- see initNode's unconditional `nodeData.credential = ''` -- so this fires for
    // essentially every generated flow that uses a tool; that's expected, not a bug).
    const componentNodes = (config.componentNodes || {}) as Record<string, any>
    const boundToolNames = new Set<string>()
    const toolNeedsCredentialButHasNone = new Set<string>()
    for (const node of nodes) {
        const agentTools = (node.data.inputs?.agentTools as AgentToolConfig[] | undefined) || []
        for (const t of agentTools) {
            if (!t.agentSelectedTool) continue
            boundToolNames.add(t.agentSelectedTool)
            const hasCredentialField = !!componentNodes[t.agentSelectedTool]?.credential
            const hasCredentialSet = !!(t.agentSelectedToolConfig as Record<string, any>)?.[FLOWISE_CREDENTIAL_ID_KEY]
            if (hasCredentialField && !hasCredentialSet) toolNeedsCredentialButHasNone.add(t.agentSelectedTool)
        }
        const boundTool = node.data.inputs?.toolAgentflowSelectedTool
        if (boundTool) {
            boundToolNames.add(boundTool)
            const hasCredentialField = !!componentNodes[boundTool]?.credential
            const hasCredentialSet = !!(node.data.inputs?.toolAgentflowSelectedToolConfig as Record<string, any>)?.[
                FLOWISE_CREDENTIAL_ID_KEY
            ]
            if (hasCredentialField && !hasCredentialSet) toolNeedsCredentialButHasNone.add(boundTool)
        }
    }
    const hasWriteCapableTool = Array.from(boundToolNames).some((name) => isWriteCapableToolNode(componentNodes[name]))
    const hasHumanInputNode = nodes.some((n) => n.data.name === 'humanInputAgentflow')
    if (hasWriteCapableTool && !hasHumanInputNode) {
        warnings.push(
            'This flow uses at least one tool capable of mutating actions (sending, creating, deleting, etc.) but has no human-in-the-loop approval node anywhere -- review whether autonomous write access is intended before deploying.'
        )
    }
    if (toolNeedsCredentialButHasNone.size > 0) {
        const names = Array.from(toolNeedsCredentialButHasNone)
            .map((name) => componentNodes[name]?.label || name)
            .join(', ')
        warnings.push(`The following tools need a credential selected before they'll work: ${names}.`)
    }

    return warnings
}

const updateEdges = (edges: Edge[], nodes: Node[]): Edge[] => {
    const isMultiOutput = (source: string) => {
        return source.includes('conditionAgentflow') || source.includes('conditionAgentAgentflow') || source.includes('humanInputAgentflow')
    }
    const findNodeColor = (nodeId: string) => {
        const node = nodes.find((node) => node.id === nodeId)
        return node?.data?.color
    }

    // filter out edges that do not exist in nodes
    edges = edges.filter((edge) => {
        return nodes.some((node) => node.id === edge.source || node.id === edge.target)
    })

    // filter out the edge that has hideInput/hideOutput on the source/target node
    const indexToDelete = []
    for (let i = 0; i < edges.length; i += 1) {
        const edge = edges[i]
        const sourceNode = nodes.find((node) => node.id === edge.source)
        if (sourceNode?.data?.hideOutput) {
            indexToDelete.push(i)
        }

        const targetNode = nodes.find((node) => node.id === edge.target)
        if (targetNode?.data?.hideInput) {
            indexToDelete.push(i)
        }
    }

    // delete the edges at the index in indexToDelete
    for (let i = indexToDelete.length - 1; i >= 0; i -= 1) {
        edges.splice(indexToDelete[i], 1)
    }

    const updatedEdges = edges.map((edge) => {
        return {
            ...edge,
            data: {
                ...edge.data,
                sourceColor: findNodeColor(edge.source),
                targetColor: findNodeColor(edge.target),
                edgeLabel: isMultiOutput(edge.source) && edge.label && edge.label.trim() !== '' ? edge.label.trim() : undefined,
                isHumanInput: edge.source.includes('humanInputAgentflow') ? true : false
            },
            type: 'agentFlow',
            id: `${edge.source}-${edge.sourceHandle}-${edge.target}-${edge.targetHandle}`
        }
    }) as Edge[]

    if (updatedEdges.length > 0) {
        updatedEdges.forEach((edge) => {
            if (isMultiOutput(edge.source)) {
                if (edge.sourceHandle.includes('true')) {
                    edge.sourceHandle = edge.sourceHandle.replace('true', '0')
                } else if (edge.sourceHandle.includes('false')) {
                    edge.sourceHandle = edge.sourceHandle.replace('false', '1')
                }
            }
        })
    }

    return updatedEdges
}

/**
 * If `node` is the execute step of a propose(agent)->approve(HITL)->execute shape -- either
 * directly fed by an agentAgentflow, or fed via a humanInputAgentflow approval gate's approved
 * ('true') branch -- walk backward from there to find the nearest upstream agentAgentflow node
 * that already has tools selected, and return its tool names. The execute step MUST reuse those
 * tools, not pick unrelated ones.
 *
 * The backward walk (not just a 1-2 hop lookup) matters because the generator doesn't always put
 * the tool-bearing agent immediately before the gate -- e.g. propose can be a plain llmAgentflow
 * "draft the action" step (no tools of its own) with the real tool-bearing agent further
 * upstream, before a conditionAgentAgentflow read/write split. Only the hop immediately feeding
 * `node` needs to be a HITL-approved-branch or direct-agent edge; hops beyond that just need to
 * lead somewhere, since they're the propose/classification chain, not additional gates.
 *
 * Returns [] when `node` isn't in this shape at all (e.g. an independent agentAgentflow or
 * toolAgentflow keeps today's dedup behavior).
 */
export const findProposingAgentTools = (node: Node, nodes: Node[], edges: Edge[]): string[] => {
    const nodeById = new Map(nodes.map((n) => [n.id, n]))
    const inboundEdge = edges.find((e) => e.target === node.id)
    if (!inboundEdge) return []

    const immediateSource = nodeById.get(inboundEdge.source)
    const viaApprovedGate = immediateSource?.data.name === 'humanInputAgentflow' && inboundEdge.sourceHandle.includes('true')
    const directFromAgent = immediateSource?.data.name === 'agentAgentflow'
    if (!viaApprovedGate && !directFromAgent) return [] // not this shape -- keep today's dedup default

    const visited = new Set<string>([node.id])
    const queue: string[] = [inboundEdge.source]
    while (queue.length > 0) {
        const currentId = queue.shift()!
        if (visited.has(currentId)) continue
        visited.add(currentId)

        const current = nodeById.get(currentId)
        if (current?.data.name === 'agentAgentflow') {
            const agentTools = (current.data.inputs?.agentTools as AgentToolConfig[] | undefined) || []
            const tools = agentTools.map((t) => t.agentSelectedTool).filter(Boolean)
            if (tools.length > 0) return tools
        }

        edges.filter((e) => e.target === currentId).forEach((e) => queue.push(e.source))
    }
    return []
}

const generateSelectedTools = async (
    nodes: Node[],
    edges: Edge[],
    config: Record<string, any>,
    question: string,
    options: ICommonObject
) => {
    const selectedTools: string[] = []

    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i]
        if (!node.data.inputs) {
            node.data.inputs = {}
        }

        if (node.data.name === 'agentAgentflow') {
            const proposingAgentTools = findProposingAgentTools(node, nodes, edges)

            if (proposingAgentTools.length > 0) {
                // This agent IS the execute step of a propose->approve->execute shape -- reuse
                // the proposing agent's tools directly rather than asking an LLM to pick again
                // (which is exactly what "must NOT reuse an already-selected tool" would break,
                // same failure mode as the toolAgentflow case above).
                selectedTools.push(...proposingAgentTools)
                const existingTools = node.data.inputs.agentTools || []
                node.data.inputs.agentTools = [
                    ...existingTools,
                    ...proposingAgentTools.map((tool) => ({
                        agentSelectedTool: tool,
                        agentSelectedToolConfig: { agentSelectedTool: tool }
                    }))
                ]
                continue
            }

            const sysPrompt = `You are a workflow orchestrator that is designed to make agent coordination and execution easy. Your goal is to select the tools that are needed to achieve the given task.

Here are the tools to choose from:
${config.toolNodes}

Here's the selected tools:
${JSON.stringify(selectedTools, null, 2)}

Output Format should be a list of tool names:
For example:["googleCustomSearch", "slackMCP"]

Now, select the tools that are needed to achieve the given task. You must only select tools that are in the list of tools above. You must NOT select the tools that are already in the list of selected tools.
`
            const tools = await _generateSelectedTools({ ...config, prompt: sysPrompt }, question, options)
            if (Array.isArray(tools) && tools.length > 0) {
                selectedTools.push(...tools)

                const existingTools = node.data.inputs.agentTools || []
                node.data.inputs.agentTools = [
                    ...existingTools,
                    ...tools.map((tool) => ({
                        agentSelectedTool: tool,
                        agentSelectedToolConfig: {
                            agentSelectedTool: tool
                        }
                    }))
                ]
            }
        } else if (node.data.name === 'toolAgentflow') {
            const proposingAgentTools = findProposingAgentTools(node, nodes, edges)

            if (proposingAgentTools.length === 1) {
                // Deterministic: exactly one candidate, so there's no ambiguity to hand to an
                // LLM -- reuse it directly rather than risk a model picking something else.
                const tool = proposingAgentTools[0]
                selectedTools.push(tool)
                node.data.inputs.toolAgentflowSelectedTool = tool
                node.data.inputs.toolInputArgs = []
                node.data.inputs.toolAgentflowSelectedToolConfig = { toolAgentflowSelectedTool: tool }
                continue
            }

            const isReuseCase = proposingAgentTools.length > 1
            const sysPrompt = isReuseCase
                ? `You are a workflow orchestrator that is designed to make agent coordination and execution easy. This tool node executes an action that was already proposed and approved by an upstream agent -- your goal is to select ONE tool that matches what that agent proposed.

Here are the ONLY tools you may choose from (the upstream agent's own tools -- you must pick one of these, not a different tool):
${JSON.stringify(proposingAgentTools, null, 2)}

Output Format should be ONLY one tool name inside of a list:
For example:["${proposingAgentTools[0]}"]

Now, select the ONE tool from the list above that matches the approved action.
`
                : `You are a workflow orchestrator that is designed to make agent coordination and execution easy. Your goal is to select ONE tool that is needed to achieve the given task.

Here are the tools to choose from:
${config.toolNodes}

Here's the selected tools:
${JSON.stringify(selectedTools, null, 2)}

Output Format should ONLY one tool name inside of a list:
For example:["googleCustomSearch"]

Now, select the ONLY tool that is needed to achieve the given task. You must only select tool that is in the list of tools above. You must NOT select the tool that is already in the list of selected tools.
`
            const tools = await _generateSelectedTools({ ...config, prompt: sysPrompt }, question, options)
            if (Array.isArray(tools) && tools.length > 0) {
                selectedTools.push(...tools)

                node.data.inputs.toolAgentflowSelectedTool = tools[0]
                node.data.inputs.toolInputArgs = []
                node.data.inputs.toolAgentflowSelectedToolConfig = {
                    toolAgentflowSelectedTool: tools[0]
                }
            }
        }
    }

    return nodes
}

const _generateSelectedTools = async (config: Record<string, any>, question: string, options: ICommonObject) => {
    try {
        const chatModelComponent = config.componentNodes[config.selectedChatModel?.name]
        if (!chatModelComponent) {
            throw new Error('Chat model component not found')
        }
        const nodeInstanceFilePath = chatModelComponent.filePath as string
        const nodeModule = await import(nodeInstanceFilePath)
        const newToolNodeInstance = new nodeModule.nodeClass()
        const model = (await newToolNodeInstance.init(config.selectedChatModel, '', options)) as BaseChatModel

        // Create a parser to validate the output
        const parser = StructuredOutputParser.fromZodSchema(ToolType as any)

        // Generate JSON schema from our Zod schema
        const formatInstructions = parser.getFormatInstructions()

        // Full conversation with system prompt and instructions
        const messages = [
            {
                role: 'system',
                content: `${config.prompt}\n\n${formatInstructions}\n\nMake sure to follow the exact JSON schema structure.`
            },
            {
                role: 'user',
                content: question
            }
        ]

        // Standard completion without structured output
        const response = await model.invoke(messages)

        // Try to extract JSON from the response
        const responseContent = extractResponseContent(response)
        const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) || responseContent.match(/{[\s\S]*?}/)

        if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0]
            try {
                const parsedJSON = JSON.parse(jsonStr)
                // Validate with our schema
                return ToolType.parse(parsedJSON)
            } catch (parseError) {
                console.error('Error parsing JSON from response:', parseError)
                return { error: 'Failed to parse JSON from response', content: responseContent }
            }
        } else {
            console.error('No JSON found in response:', responseContent)
            return { error: 'No JSON found in response', content: responseContent }
        }
    } catch (error) {
        console.error('Error generating AgentflowV2:', error)
        return { error: error.message || 'Unknown error occurred' }
    }
}

const generateNodesEdges = async (config: Record<string, any>, question: string, options?: ICommonObject) => {
    try {
        const chatModelComponent = config.componentNodes[config.selectedChatModel?.name]
        if (!chatModelComponent) {
            throw new Error('Chat model component not found')
        }
        const nodeInstanceFilePath = chatModelComponent.filePath as string
        const nodeModule = await import(nodeInstanceFilePath)
        const newToolNodeInstance = new nodeModule.nodeClass()
        const model = (await newToolNodeInstance.init(config.selectedChatModel, '', options)) as BaseChatModel

        // Create a parser to validate the output
        const parser = StructuredOutputParser.fromZodSchema(NodesEdgesType as any)

        // Generate JSON schema from our Zod schema
        const formatInstructions = parser.getFormatInstructions()

        // Full conversation with system prompt and instructions
        const messages = [
            {
                role: 'system',
                content: `${config.prompt}\n\n${formatInstructions}\n\nMake sure to follow the exact JSON schema structure.`
            },
            {
                role: 'user',
                content: question
            }
        ]

        // Standard completion without structured output
        const response = await model.invoke(messages)

        // Try to extract JSON from the response
        const responseContent = extractResponseContent(response)
        const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) || responseContent.match(/{[\s\S]*?}/)

        if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0]
            try {
                const parsedJSON = JSON.parse(jsonStr)
                // Validate with our schema
                return NodesEdgesType.parse(parsedJSON)
            } catch (parseError) {
                console.error('Error parsing JSON from response:', parseError)
                return { error: 'Failed to parse JSON from response', content: responseContent }
            }
        } else {
            console.error('No JSON found in response:', responseContent)
            return { error: 'No JSON found in response', content: responseContent }
        }
    } catch (error) {
        console.error('Error generating AgentflowV2:', error)
        return { error: error.message || 'Unknown error occurred' }
    }
}

const generateNodesData = (result: Record<string, any>, config: Record<string, any>) => {
    try {
        if (result.error) {
            return result
        }

        let nodes = result.nodes

        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i]
            let nodeName = node.data.name

            // If nodeName is not found in data.name, try extracting from node.id
            if (!nodeName || !config.componentNodes[nodeName]) {
                nodeName = node.id.split('_')[0]
            }

            const componentNode = config.componentNodes[nodeName]
            if (!componentNode) {
                continue
            }

            const initializedNodeData = initNode(cloneDeep(componentNode), node.id)
            nodes[i].data = {
                ...initializedNodeData,
                label: node.data?.label
            }

            if (nodes[i].data.name === 'iterationAgentflow') {
                nodes[i].type = 'iteration'
            }

            if (nodes[i].parentNode) {
                nodes[i].extent = 'parent'
            }
        }

        return { nodes, edges: result.edges }
    } catch (error) {
        console.error('Error generating AgentflowV2:', error)
        return { error: error.message || 'Unknown error occurred' }
    }
}

const initNode = (nodeData: Record<string, any>, newNodeId: string): NodeData => {
    const inputParams = []
    const incoming = nodeData.inputs ? nodeData.inputs.length : 0

    // Inputs
    for (let i = 0; i < incoming; i += 1) {
        const newInput = {
            ...nodeData.inputs[i],
            id: `${newNodeId}-input-${nodeData.inputs[i].name}-${nodeData.inputs[i].type}`
        }
        inputParams.push(newInput)
    }

    // Credential
    if (nodeData.credential) {
        const newInput = {
            ...nodeData.credential,
            id: `${newNodeId}-input-${nodeData.credential.name}-${nodeData.credential.type}`
        }
        inputParams.unshift(newInput)
    }

    // Outputs
    let outputAnchors = initializeOutputAnchors(nodeData, newNodeId)

    /* Initial
    inputs = [
        {
            label: 'field_label_1',
            name: 'string'
        },
        {
            label: 'field_label_2',
            name: 'CustomType'
        }
    ]

    =>  Convert to inputs, inputParams, inputAnchors

    =>  inputs = { 'field': 'defaultvalue' } // Turn into inputs object with default values
    
    =>  // For inputs that are part of whitelistTypes
        inputParams = [
            {
                label: 'field_label_1',
                name: 'string'
            }
        ]

    =>  // For inputs that are not part of whitelistTypes
        inputAnchors = [
            {
                label: 'field_label_2',
                name: 'CustomType'
            }
        ]
    */

    // Inputs
    if (nodeData.inputs) {
        const defaultInputs = initializeDefaultNodeData(nodeData.inputs)
        nodeData.inputAnchors = showHideInputAnchors({ ...nodeData, inputAnchors: [], inputs: defaultInputs })
        nodeData.inputParams = showHideInputParams({ ...nodeData, inputParams, inputs: defaultInputs })
        nodeData.inputs = defaultInputs
    } else {
        nodeData.inputAnchors = []
        nodeData.inputParams = []
        nodeData.inputs = {}
    }

    // Outputs
    if (nodeData.outputs) {
        nodeData.outputs = initializeDefaultNodeData(outputAnchors)
    } else {
        nodeData.outputs = {}
    }
    nodeData.outputAnchors = outputAnchors

    // Credential
    if (nodeData.credential) nodeData.credential = ''

    nodeData.id = newNodeId

    return nodeData
}

const initializeDefaultNodeData = (nodeParams: Record<string, any>[]) => {
    const initialValues: Record<string, any> = {}

    for (let i = 0; i < nodeParams.length; i += 1) {
        const input = nodeParams[i]
        initialValues[input.name] = input.default || ''
    }

    return initialValues
}

const createAgentFlowOutputs = (nodeData: Record<string, any>, newNodeId: string) => {
    if (nodeData.hideOutput) return []

    if (nodeData.outputs?.length) {
        return nodeData.outputs.map((_: any, index: number) => ({
            id: `${newNodeId}-output-${index}`,
            label: nodeData.label,
            name: nodeData.name
        }))
    }

    return [
        {
            id: `${newNodeId}-output-${nodeData.name}`,
            label: nodeData.label,
            name: nodeData.name
        }
    ]
}

const initializeOutputAnchors = (nodeData: Record<string, any>, newNodeId: string): OutputAnchor[] => {
    return createAgentFlowOutputs(nodeData, newNodeId)
}

const _showHideOperation = (nodeData: Record<string, any>, inputParam: Record<string, any>, displayType: string, index?: number) => {
    const displayOptions = inputParam[displayType]
    /* For example:
    show: {
        enableMemory: true
    }
    */
    Object.keys(displayOptions).forEach((path) => {
        const comparisonValue = displayOptions[path]
        if (path.includes('$index') && index) {
            path = path.replace('$index', index.toString())
        }
        let groundValue = get(nodeData.inputs, path, '')
        if (groundValue && typeof groundValue === 'string' && groundValue.startsWith('[') && groundValue.endsWith(']')) {
            groundValue = JSON.parse(groundValue)
        }

        // Handle case where groundValue is an array
        if (Array.isArray(groundValue)) {
            if (Array.isArray(comparisonValue)) {
                // Both are arrays - check if there's any intersection
                const hasIntersection = comparisonValue.some((val) => groundValue.includes(val))
                if (displayType === 'show' && !hasIntersection) {
                    inputParam.display = false
                }
                if (displayType === 'hide' && hasIntersection) {
                    inputParam.display = false
                }
            } else if (typeof comparisonValue === 'string') {
                // comparisonValue is string, groundValue is array - check if array contains the string
                const matchFound = groundValue.some((val) => comparisonValue === val || new RegExp(comparisonValue).test(val))
                if (displayType === 'show' && !matchFound) {
                    inputParam.display = false
                }
                if (displayType === 'hide' && matchFound) {
                    inputParam.display = false
                }
            } else if (typeof comparisonValue === 'boolean' || typeof comparisonValue === 'number') {
                // For boolean/number comparison with array, check if array contains the value
                const matchFound = groundValue.includes(comparisonValue)
                if (displayType === 'show' && !matchFound) {
                    inputParam.display = false
                }
                if (displayType === 'hide' && matchFound) {
                    inputParam.display = false
                }
            } else if (typeof comparisonValue === 'object') {
                // For object comparison with array, use deep equality check
                const matchFound = groundValue.some((val) => isEqual(comparisonValue, val))
                if (displayType === 'show' && !matchFound) {
                    inputParam.display = false
                }
                if (displayType === 'hide' && matchFound) {
                    inputParam.display = false
                }
            }
        } else {
            // Original logic for non-array groundValue
            if (Array.isArray(comparisonValue)) {
                if (displayType === 'show' && !comparisonValue.includes(groundValue)) {
                    inputParam.display = false
                }
                if (displayType === 'hide' && comparisonValue.includes(groundValue)) {
                    inputParam.display = false
                }
            } else if (typeof comparisonValue === 'string') {
                if (displayType === 'show' && !(comparisonValue === groundValue || new RegExp(comparisonValue).test(groundValue))) {
                    inputParam.display = false
                }
                if (displayType === 'hide' && (comparisonValue === groundValue || new RegExp(comparisonValue).test(groundValue))) {
                    inputParam.display = false
                }
            } else if (typeof comparisonValue === 'boolean') {
                if (displayType === 'show' && comparisonValue !== groundValue) {
                    inputParam.display = false
                }
                if (displayType === 'hide' && comparisonValue === groundValue) {
                    inputParam.display = false
                }
            } else if (typeof comparisonValue === 'object') {
                if (displayType === 'show' && !isEqual(comparisonValue, groundValue)) {
                    inputParam.display = false
                }
                if (displayType === 'hide' && isEqual(comparisonValue, groundValue)) {
                    inputParam.display = false
                }
            } else if (typeof comparisonValue === 'number') {
                if (displayType === 'show' && comparisonValue !== groundValue) {
                    inputParam.display = false
                }
                if (displayType === 'hide' && comparisonValue === groundValue) {
                    inputParam.display = false
                }
            }
        }
    })
}

const showHideInputs = (nodeData: Record<string, any>, inputType: string, overrideParams?: Record<string, any>, arrayIndex?: number) => {
    const params = overrideParams ?? nodeData[inputType] ?? []

    for (let i = 0; i < params.length; i += 1) {
        const inputParam = params[i]

        // Reset display flag to false for each inputParam
        inputParam.display = true

        if (inputParam.show) {
            _showHideOperation(nodeData, inputParam, 'show', arrayIndex)
        }
        if (inputParam.hide) {
            _showHideOperation(nodeData, inputParam, 'hide', arrayIndex)
        }
    }

    return params
}

const showHideInputParams = (nodeData: Record<string, any>): InputParam[] => {
    return showHideInputs(nodeData, 'inputParams')
}

const showHideInputAnchors = (nodeData: Record<string, any>): InputAnchor[] => {
    return showHideInputs(nodeData, 'inputAnchors')
}
