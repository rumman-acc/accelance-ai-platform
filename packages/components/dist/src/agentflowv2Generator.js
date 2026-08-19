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
Object.defineProperty(exports, '__esModule', { value: true })
exports.findProposingAgentTools = exports.validateAndRepairFlow = exports.generateAgentflowv2 = void 0
const v3_1 = require('zod/v3')
const output_parsers_1 = require('@langchain/core/output_parsers')
const lodash_1 = require('lodash')
const utils_1 = require('./utils')
const toolActionRisk_1 = require('./toolActionRisk')
const ToolType = v3_1.z.array(v3_1.z.string()).describe('List of tools')
// Phase-1 generation (generateNodesEdges) only ever produces graph shape -- its own NodeDataType
// schema below caps node.data to {label, name}, and phase-2 (generateNodesData/initNode) then
// overwrites every node's inputs with the component's own generic defaults regardless of what the
// flow is actually for. These two schemas back the per-node content-generation calls that fill in
// the task-specific text those two phases skip: a router's branch descriptions, and an agent's
// system instructions.
const RouterContentType = v3_1.z.object({
    instructions: v3_1.z.string().describe('General instructions for how the router should classify input into one of the scenarios below'),
    scenarios: v3_1.z
        .array(v3_1.z.string())
        .describe('One scenario description per outgoing branch, in the exact order the branches were given')
})
const AgentInstructionsType = v3_1.z.object({
    instructions: v3_1.z
        .string()
        .describe("System instructions describing this agent's specific role and responsibilities within the overall workflow")
})
// Key AgentFlow V2's dynamic model/tool config objects use to hold a selected credential id
// (see Tool.ts: `selectedToolConfig['FLOWISE_CREDENTIAL_ID']`, and the llmModelConfig shape
// built in generateSelectedTools/validateAndRepairFlow below).
const FLOWISE_CREDENTIAL_ID_KEY = 'FLOWISE_CREDENTIAL_ID'
// Define a more specific NodePosition schema
const NodePositionType = v3_1.z.object({
    x: v3_1.z.number().describe('X coordinate of the node position'),
    y: v3_1.z.number().describe('Y coordinate of the node position')
})
// Define a more specific EdgeData schema
const EdgeDataType = v3_1.z.object({
    edgeLabel: v3_1.z.string().optional().describe('Label for the edge')
})
// Define a basic NodeData schema to avoid using .passthrough() which might cause issues
const NodeDataType = v3_1.z
    .object({
        label: v3_1.z.string().optional().describe('Label for the node'),
        name: v3_1.z.string().optional().describe('Name of the node')
    })
    .optional()
const NodeType = v3_1.z.object({
    id: v3_1.z.string().describe('Unique identifier for the node'),
    type: v3_1.z.enum(['agentFlow']).describe('Type of the node'),
    position: NodePositionType.describe('Position of the node in the UI'),
    width: v3_1.z.number().describe('Width of the node'),
    height: v3_1.z.number().describe('Height of the node'),
    selected: v3_1.z.boolean().optional().describe('Whether the node is selected'),
    positionAbsolute: NodePositionType.optional().describe('Absolute position of the node'),
    data: NodeDataType
})
const EdgeType = v3_1.z.object({
    id: v3_1.z.string().describe('Unique identifier for the edge'),
    type: v3_1.z.enum(['agentFlow']).describe('Type of the node'),
    source: v3_1.z.string().describe('ID of the source node'),
    sourceHandle: v3_1.z.string().describe('ID of the source handle'),
    target: v3_1.z.string().describe('ID of the target node'),
    targetHandle: v3_1.z.string().describe('ID of the target handle'),
    data: EdgeDataType.optional().describe('Data associated with the edge')
})
const NodesEdgesType = v3_1.z
    .object({
        description: v3_1.z.string().optional().describe('Description of the workflow'),
        usecases: v3_1.z.array(v3_1.z.string()).optional().describe('Use cases for this workflow'),
        nodes: v3_1.z.array(NodeType).describe('Array of nodes in the workflow'),
        edges: v3_1.z.array(EdgeType).describe('Array of edges connecting the nodes')
    })
    .describe('Generate Agentflowv2 nodes and edges')
const generateAgentflowv2 = async (config, question, options) => {
    try {
        const result = await generateNodesEdges(config, question, options)
        const { nodes, edges } = generateNodesData(result, config)
        const updatedNodes = await generateSelectedTools(nodes, edges, config, question, options)
        const updatedEdges = updateEdges(edges, nodes)
        const warnings = (0, exports.validateAndRepairFlow)(updatedNodes, updatedEdges, config)
        return { nodes: updatedNodes, edges: updatedEdges, ...(warnings.length > 0 ? { warnings } : {}) }
    } catch (error) {
        console.error('Error generating AgentflowV2:', error)
        return { error: error.message || 'Unknown error occurred' }
    }
}
exports.generateAgentflowv2 = generateAgentflowv2
/**
 * Deterministic post-generation safety net -- catches what prompt engineering (generateNodesEdges,
 * generateSelectedTools) doesn't reliably get right on its own:
 * 1. Forces every agentAgentflow/llmAgentflow/conditionAgentAgentflow (router) node onto the
 *    model+credential the user picked to generate this flow with (config.selectedChatModel) --
 *    unconditionally. Not a repair for a missing value; a deliberate consistency rule, since the
 *    generating LLM is otherwise free to put a different provider on different nodes.
 * 2. Flags a toolAgentflow node whose bound tool doesn't match what its proposing agent
 *    selected -- a backstop for findProposingAgentTools()'s reuse logic above, independent of
 *    whether that logic covers every graph shape.
 * 3. Flags a conditionAgentAgentflow node whose scenarios/instructions are still blank --
 *    generateSelectedTools' router-content generation is a best-effort LLM call and can fail
 *    (model error, unparseable response, zero matched branches); this node's own runtime code
 *    hard-errors on an empty scenario list, so a failure here is a guaranteed crash, not a
 *    quality issue, and needs to reach the user before they hit it mid-run.
 * 4. Flags the whole flow if it binds any write-capable tool (per toolActionRisk's naming-based
 *    classifier) but contains no humanInputAgentflow node anywhere -- a coarse, whole-flow check
 *    by design: a precise per-path "is this specific call gated" analysis would need to track
 *    which branches actually lead to a mutating call, which the tool-binding data at generation
 *    time doesn't distinguish (an agent's tool binding exposes all of a tool's actions, not just
 *    the read-only ones, even when its own role is meant to be read-only or propose-only). This
 *    whole-flow check is intentionally coarse to avoid false-flagging a correctly-built
 *    propose/approve/execute flow (whose read and propose agents legitimately have write-capable
 *    tools bound without being preceded by a gate themselves) while still catching the case with
 *    no safety structure anywhere.
 * 5. Lists every bound tool that declares a credential field but has none set -- true for
 *    essentially every tool node the generator creates, since initNode() unconditionally clears
 *    credential (see below). Surfaced as one combined warning so the caller (UI) can tell the
 *    user exactly what still needs configuring, rather than the generated flow silently failing
 *    the first time a tool actually runs.
 */
// Every agentflow node type whose inputs carry its own model selection, keyed by node.data.name,
// mapped to the input field that holds the model name (the companion `${field}Config` object
// follows the same naming convention for all three).
const MODEL_FIELD_BY_NODE_NAME = {
    agentAgentflow: 'agentModel',
    llmAgentflow: 'llmModel',
    conditionAgentAgentflow: 'conditionAgentModel'
}
const validateAndRepairFlow = (nodes, edges, config) => {
    const warnings = []
    // 1. Force every agentAgentflow/llmAgentflow/conditionAgentAgentflow (router) node onto the
    // exact model+credential the user picked to generate this flow with (config.selectedChatModel)
    // -- unconditionally, not just when empty. The phase-1 LLM is free to put a different provider
    // on different nodes (seen in practice: it once picked Gemini for one node while the user had
    // selected Anthropic in the generation dialog), which is surprising and not what "the model I
    // picked to build this" implies. This is a deliberate consistency choice, not a bug repair, so
    // it doesn't warn.
    const selectedChatModel = config.selectedChatModel
    if (selectedChatModel?.name) {
        for (const node of nodes) {
            const modelField = node.data.name ? MODEL_FIELD_BY_NODE_NAME[node.data.name] : undefined
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
            const modelField = node.data.name ? MODEL_FIELD_BY_NODE_NAME[node.data.name] : undefined
            if (modelField && !node.data.inputs?.[modelField]) {
                warnings.push(`"${node.data.label || node.id}" has no model selected and none was available to default to.`)
            }
        }
    }
    // 2. toolAgentflow-vs-proposing-agent consistency backstop.
    for (const node of nodes) {
        if (node.data.name !== 'toolAgentflow') continue
        const proposingTools = (0, exports.findProposingAgentTools)(node, nodes, edges)
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
    // 3. Router content backstop: a conditionAgentAgentflow node whose scenarios are still blank
    // (all-empty-string, its component default) or whose instructions are still empty means the
    // per-node router content generation in generateSelectedTools either failed (model error,
    // unparseable response) or found zero matching branches -- this node WILL error at runtime
    // (the node's own code refuses to classify against an empty scenario list), so surface it
    // now rather than let the user discover it mid-run.
    for (const node of nodes) {
        if (node.data.name !== 'conditionAgentAgentflow') continue
        const scenarios = node.data.inputs?.conditionAgentScenarios || []
        const hasRealScenario = scenarios.some((s) => s.scenario && s.scenario.trim())
        const hasInstructions = !!node.data.inputs?.conditionAgentInstructions?.trim()
        if (!hasRealScenario || !hasInstructions) {
            warnings.push(
                `"${
                    node.data.label || node.id
                }" is a router with no scenarios/instructions generated -- it will fail as soon as it runs. Open the node and fill these in manually.`
            )
        }
    }
    // 4 & 5. Whole-flow checks: any HITL gate at all, and which bound tools still need a
    // credential picked (every tool node the generator creates comes out with credential
    // cleared -- see initNode's unconditional `nodeData.credential = ''` -- so this fires for
    // essentially every generated flow that uses a tool; that's expected, not a bug).
    const componentNodes = config.componentNodes || {}
    const boundToolNames = new Set()
    const toolNeedsCredentialButHasNone = new Set()
    for (const node of nodes) {
        const agentTools = node.data.inputs?.agentTools || []
        for (const t of agentTools) {
            if (!t.agentSelectedTool) continue
            boundToolNames.add(t.agentSelectedTool)
            const hasCredentialField = !!componentNodes[t.agentSelectedTool]?.credential
            const hasCredentialSet = !!t.agentSelectedToolConfig?.[FLOWISE_CREDENTIAL_ID_KEY]
            if (hasCredentialField && !hasCredentialSet) toolNeedsCredentialButHasNone.add(t.agentSelectedTool)
        }
        const boundTool = node.data.inputs?.toolAgentflowSelectedTool
        if (boundTool) {
            boundToolNames.add(boundTool)
            const hasCredentialField = !!componentNodes[boundTool]?.credential
            const hasCredentialSet = !!node.data.inputs?.toolAgentflowSelectedToolConfig?.[FLOWISE_CREDENTIAL_ID_KEY]
            if (hasCredentialField && !hasCredentialSet) toolNeedsCredentialButHasNone.add(boundTool)
        }
    }
    const hasWriteCapableTool = Array.from(boundToolNames).some((name) =>
        (0, toolActionRisk_1.isWriteCapableToolNode)(componentNodes[name])
    )
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
exports.validateAndRepairFlow = validateAndRepairFlow
const updateEdges = (edges, nodes) => {
    const isMultiOutput = (source) => {
        return source.includes('conditionAgentflow') || source.includes('conditionAgentAgentflow') || source.includes('humanInputAgentflow')
    }
    const findNodeColor = (nodeId) => {
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
    })
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
const findProposingAgentTools = (node, nodes, edges) => {
    const nodeById = new Map(nodes.map((n) => [n.id, n]))
    const inboundEdge = edges.find((e) => e.target === node.id)
    if (!inboundEdge) return []
    const immediateSource = nodeById.get(inboundEdge.source)
    const viaApprovedGate = immediateSource?.data.name === 'humanInputAgentflow' && inboundEdge.sourceHandle.includes('true')
    const directFromAgent = immediateSource?.data.name === 'agentAgentflow'
    if (!viaApprovedGate && !directFromAgent) return [] // not this shape -- keep today's dedup default
    const visited = new Set([node.id])
    const queue = [inboundEdge.source]
    while (queue.length > 0) {
        const currentId = queue.shift()
        if (visited.has(currentId)) continue
        visited.add(currentId)
        const current = nodeById.get(currentId)
        if (current?.data.name === 'agentAgentflow') {
            const agentTools = current.data.inputs?.agentTools || []
            const tools = agentTools.map((t) => t.agentSelectedTool).filter(Boolean)
            if (tools.length > 0) return tools
        }
        edges.filter((e) => e.target === currentId).forEach((e) => queue.push(e.source))
    }
    return []
}
exports.findProposingAgentTools = findProposingAgentTools
const generateSelectedTools = async (nodes, edges, config, question, options) => {
    const selectedTools = []
    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i]
        if (!node.data.inputs) {
            node.data.inputs = {}
        }
        if (node.data.name === 'agentAgentflow') {
            const proposingAgentTools = (0, exports.findProposingAgentTools)(node, nodes, edges)
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
            } else {
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
            }
            // Give this agent task-specific role instructions -- without this, agentMessages
            // stays at its blank default and the agent runs on nothing but its label + tools,
            // regardless of what the flow actually needs it to do.
            const agentToolNames = (node.data.inputs.agentTools || []).map((t) => t.agentSelectedTool)
            const instructionsSysPrompt = `You are a workflow orchestrator building an agent step ("${
                node.data.label || node.id
            }") that is one part of a larger workflow for the user's overall request below.

This agent has access to the following tools: ${JSON.stringify(agentToolNames)}.

Write clear, specific system instructions -- as if written directly to this agent -- describing exactly this agent's role, responsibilities, and boundaries within the overall workflow. Do not write a generic "you are a helpful assistant" description; be specific to what this agent, by this name and in this position in the workflow, is actually meant to do.
`
            const instructionsResult = await _generateAgentInstructions({ ...config, prompt: instructionsSysPrompt }, question, options)
            if (instructionsResult && typeof instructionsResult.instructions === 'string' && instructionsResult.instructions.trim()) {
                node.data.inputs.agentMessages = [{ role: 'system', content: instructionsResult.instructions }]
            }
        } else if (node.data.name === 'conditionAgentAgentflow') {
            // Branch indices come from the edges' own sourceHandle suffix (`${node.id}-output-N`)
            // -- this convention is set by phase-1 generation itself (edges, unlike node.data,
            // aren't stripped from the few-shot marketplace templates), so it's already reliable
            // by the time this runs. conditionAgentScenarios' array order must match it exactly,
            // since the node's own runtime maps scenario array index straight to output index.
            const branchTargetLabels = {}
            for (const edge of edges) {
                if (edge.source !== node.id) continue
                const match = edge.sourceHandle?.match(/-output-(\d+)$/)
                if (!match) continue
                const idx = parseInt(match[1], 10)
                const targetNode = nodes.find((n) => n.id === edge.target)
                const label = targetNode?.data?.label || edge.target
                if (!branchTargetLabels[idx]) branchTargetLabels[idx] = []
                branchTargetLabels[idx].push(label)
            }
            const sortedIndices = Object.keys(branchTargetLabels)
                .map((k) => parseInt(k, 10))
                .sort((a, b) => a - b)
            if (sortedIndices.length > 0) {
                const branchDescriptions = sortedIndices
                    .map((idx) => `Branch ${idx}: leads to "${branchTargetLabels[idx].join(', ')}"`)
                    .join('\n')
                const routerLabel = node.data.label || node.id
                const sysPrompt = `You are a workflow orchestrator building a router step ("${routerLabel}") that classifies the user's request into exactly one of several branches, for the user's overall request below.

Branches, in the exact order you must output scenarios for:
${branchDescriptions}

Write:
1. "instructions": general instructions telling this router how to classify input into one of the scenarios below.
2. "scenarios": an array of exactly ${sortedIndices.length} short scenario descriptions, one per branch, in the exact order the branches were given above -- each describing the specific condition under which that branch should be taken.
`
                const routerContent = await _generateRouterContent({ ...config, prompt: sysPrompt }, question, options)
                if (routerContent && Array.isArray(routerContent.scenarios) && routerContent.scenarios.length === sortedIndices.length) {
                    if (routerContent.instructions) {
                        node.data.inputs.conditionAgentInstructions = routerContent.instructions
                    }
                    node.data.inputs.conditionAgentScenarios = routerContent.scenarios.map((s) => ({ scenario: s }))
                }
            }
        } else if (node.data.name === 'toolAgentflow') {
            const proposingAgentTools = (0, exports.findProposingAgentTools)(node, nodes, edges)
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
const _generateSelectedTools = async (config, question, options) => {
    try {
        const chatModelComponent = config.componentNodes[config.selectedChatModel?.name]
        if (!chatModelComponent) {
            throw new Error('Chat model component not found')
        }
        const nodeInstanceFilePath = chatModelComponent.filePath
        const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then((s) => __importStar(require(s)))
        const newToolNodeInstance = new nodeModule.nodeClass()
        const model = await newToolNodeInstance.init(config.selectedChatModel, '', options)
        // Create a parser to validate the output
        const parser = output_parsers_1.StructuredOutputParser.fromZodSchema(ToolType)
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
        const responseContent = (0, utils_1.extractResponseContent)(response)
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
const _generateRouterContent = async (config, question, options) => {
    try {
        const chatModelComponent = config.componentNodes[config.selectedChatModel?.name]
        if (!chatModelComponent) {
            throw new Error('Chat model component not found')
        }
        const nodeInstanceFilePath = chatModelComponent.filePath
        const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then((s) => __importStar(require(s)))
        const newToolNodeInstance = new nodeModule.nodeClass()
        const model = await newToolNodeInstance.init(config.selectedChatModel, '', options)
        const parser = output_parsers_1.StructuredOutputParser.fromZodSchema(RouterContentType)
        const formatInstructions = parser.getFormatInstructions()
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
        const response = await model.invoke(messages)
        const responseContent = (0, utils_1.extractResponseContent)(response)
        const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) || responseContent.match(/{[\s\S]*?}/)
        if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0]
            try {
                const parsedJSON = JSON.parse(jsonStr)
                return RouterContentType.parse(parsedJSON)
            } catch (parseError) {
                console.error('Error parsing router content JSON from response:', parseError)
                return { error: 'Failed to parse JSON from response', content: responseContent }
            }
        } else {
            console.error('No JSON found in router content response:', responseContent)
            return { error: 'No JSON found in response', content: responseContent }
        }
    } catch (error) {
        console.error('Error generating router content:', error)
        return { error: error.message || 'Unknown error occurred' }
    }
}
const _generateAgentInstructions = async (config, question, options) => {
    try {
        const chatModelComponent = config.componentNodes[config.selectedChatModel?.name]
        if (!chatModelComponent) {
            throw new Error('Chat model component not found')
        }
        const nodeInstanceFilePath = chatModelComponent.filePath
        const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then((s) => __importStar(require(s)))
        const newToolNodeInstance = new nodeModule.nodeClass()
        const model = await newToolNodeInstance.init(config.selectedChatModel, '', options)
        const parser = output_parsers_1.StructuredOutputParser.fromZodSchema(AgentInstructionsType)
        const formatInstructions = parser.getFormatInstructions()
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
        const response = await model.invoke(messages)
        const responseContent = (0, utils_1.extractResponseContent)(response)
        const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) || responseContent.match(/{[\s\S]*?}/)
        if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0]
            try {
                const parsedJSON = JSON.parse(jsonStr)
                return AgentInstructionsType.parse(parsedJSON)
            } catch (parseError) {
                console.error('Error parsing agent instructions JSON from response:', parseError)
                return { error: 'Failed to parse JSON from response', content: responseContent }
            }
        } else {
            console.error('No JSON found in agent instructions response:', responseContent)
            return { error: 'No JSON found in response', content: responseContent }
        }
    } catch (error) {
        console.error('Error generating agent instructions:', error)
        return { error: error.message || 'Unknown error occurred' }
    }
}
const generateNodesEdges = async (config, question, options) => {
    try {
        const chatModelComponent = config.componentNodes[config.selectedChatModel?.name]
        if (!chatModelComponent) {
            throw new Error('Chat model component not found')
        }
        const nodeInstanceFilePath = chatModelComponent.filePath
        const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then((s) => __importStar(require(s)))
        const newToolNodeInstance = new nodeModule.nodeClass()
        const model = await newToolNodeInstance.init(config.selectedChatModel, '', options)
        // Create a parser to validate the output
        const parser = output_parsers_1.StructuredOutputParser.fromZodSchema(NodesEdgesType)
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
        const responseContent = (0, utils_1.extractResponseContent)(response)
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
const generateNodesData = (result, config) => {
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
            const initializedNodeData = initNode((0, lodash_1.cloneDeep)(componentNode), node.id)
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
const initNode = (nodeData, newNodeId) => {
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
const initializeDefaultNodeData = (nodeParams) => {
    const initialValues = {}
    for (let i = 0; i < nodeParams.length; i += 1) {
        const input = nodeParams[i]
        initialValues[input.name] = input.default || ''
    }
    return initialValues
}
const createAgentFlowOutputs = (nodeData, newNodeId) => {
    if (nodeData.hideOutput) return []
    if (nodeData.outputs?.length) {
        return nodeData.outputs.map((_, index) => ({
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
const initializeOutputAnchors = (nodeData, newNodeId) => {
    return createAgentFlowOutputs(nodeData, newNodeId)
}
const _showHideOperation = (nodeData, inputParam, displayType, index) => {
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
        let groundValue = (0, lodash_1.get)(nodeData.inputs, path, '')
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
                const matchFound = groundValue.some((val) => (0, lodash_1.isEqual)(comparisonValue, val))
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
                if (displayType === 'show' && !(0, lodash_1.isEqual)(comparisonValue, groundValue)) {
                    inputParam.display = false
                }
                if (displayType === 'hide' && (0, lodash_1.isEqual)(comparisonValue, groundValue)) {
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
const showHideInputs = (nodeData, inputType, overrideParams, arrayIndex) => {
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
const showHideInputParams = (nodeData) => {
    return showHideInputs(nodeData, 'inputParams')
}
const showHideInputAnchors = (nodeData) => {
    return showHideInputs(nodeData, 'inputAnchors')
}
//# sourceMappingURL=agentflowv2Generator.js.map
