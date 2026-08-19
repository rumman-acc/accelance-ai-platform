import { ICommonObject } from './Interface'
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
export declare const generateAgentflowv2: (
    config: Record<string, any>,
    question: string,
    options: ICommonObject
) => Promise<
    | {
          warnings?: string[] | undefined
          nodes: Node[]
          edges: Edge[]
          error?: undefined
      }
    | {
          error: any
      }
>
export declare const validateAndRepairFlow: (nodes: Node[], edges: Edge[], config: Record<string, any>) => string[]
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
export declare const findProposingAgentTools: (node: Node, nodes: Node[], edges: Edge[]) => string[]
export {}
