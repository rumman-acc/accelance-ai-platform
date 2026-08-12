import dagre from '@dagrejs/dagre'

const DEFAULT_NODE_WIDTH = 300
const DEFAULT_NODE_HEIGHT = 100

/**
 * Re-lays-out generator-produced nodes using dagre instead of trusting the LLM's own guessed
 * {x,y} positions, which come out overlapping/messy in practice. Uses each node's own width/height
 * (already present on generator output) rather than a fixed guess, for tighter spacing.
 *
 * Cycles (e.g. a HITL-reject edge looping back to an earlier node) are fed to dagre as-is --
 * dagre's own acyclic pass handles them internally (temporarily reverses back-edges for ranking,
 * restores direction after), so no manual cycle-detection is needed here.
 */
export const getLayoutedElements = (nodes, edges, direction = 'LR') => {
    if (!nodes || nodes.length === 0) return { nodes, edges }

    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))
    dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120 })

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
            width: node.width || DEFAULT_NODE_WIDTH,
            height: node.height || DEFAULT_NODE_HEIGHT
        })
    })

    edges.forEach((edge) => {
        if (dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
            dagreGraph.setEdge(edge.source, edge.target)
        }
    })

    dagre.layout(dagreGraph)

    const layoutedNodes = nodes.map((node) => {
        const dagreNode = dagreGraph.node(node.id)
        if (!dagreNode) return node
        const width = node.width || DEFAULT_NODE_WIDTH
        const height = node.height || DEFAULT_NODE_HEIGHT
        // dagre positions are node CENTERS; React Flow positions are top-left corners.
        const position = { x: dagreNode.x - width / 2, y: dagreNode.y - height / 2 }
        return { ...node, position, positionAbsolute: position }
    })

    return { nodes: layoutedNodes, edges }
}

/**
 * Orders nodes/edges into a sequence of reveal steps -- BFS from the start node, each node
 * followed immediately by any of its edges whose other endpoint is already visible. Used to
 * progressively add generated nodes to the canvas instead of dumping everything on at once, so
 * it visually reads as the agent "being built" rather than appearing fully-formed.
 *
 * Nodes unreachable from the start node (shouldn't normally happen) are appended at the end so
 * nothing generated silently goes missing from the reveal.
 */
export const getRevealSteps = (nodes, edges) => {
    const nodeById = new Map(nodes.map((n) => [n.id, n]))
    const startNode = nodes.find((n) => n.data?.name === 'startAgentflow') || nodes[0]
    if (!startNode) return []

    const steps = []
    const visitedNodeIds = new Set()
    const addedEdgeIds = new Set()

    const revealNode = (node) => {
        if (visitedNodeIds.has(node.id)) return
        visitedNodeIds.add(node.id)
        steps.push({ type: 'node', item: node })

        edges.forEach((edge) => {
            if (addedEdgeIds.has(edge.id)) return
            const otherEndpointVisible =
                (edge.source === node.id && visitedNodeIds.has(edge.target)) || (edge.target === node.id && visitedNodeIds.has(edge.source))
            if (otherEndpointVisible) {
                addedEdgeIds.add(edge.id)
                steps.push({ type: 'edge', item: edge })
            }
        })
    }

    const queue = [startNode]
    while (queue.length > 0) {
        const current = queue.shift()
        revealNode(current)
        edges
            .filter((e) => e.source === current.id && nodeById.has(e.target) && !visitedNodeIds.has(e.target))
            .forEach((e) => queue.push(nodeById.get(e.target)))
    }

    // Anything unreachable from Start (shouldn't normally happen) -- still reveal it.
    nodes.forEach((node) => {
        if (!visitedNodeIds.has(node.id)) revealNode(node)
    })

    // Any remaining edges whose endpoints are now both visible but weren't caught above.
    edges.forEach((edge) => {
        if (!addedEdgeIds.has(edge.id) && visitedNodeIds.has(edge.source) && visitedNodeIds.has(edge.target)) {
            addedEdgeIds.add(edge.id)
            steps.push({ type: 'edge', item: edge })
        }
    })

    return steps
}
