interface NodeIconProps {
    /** Node type name, e.g. "startAgentflow", "agentAgentflow". */
    name: string;
    /** Pixel size of the rendered avatar/icon. Defaults to 32. */
    size?: number;
    /**
     * Base URL of the Flowise server. Used to construct the fallback
     * `${apiBaseUrl}/api/v1/node-icon/{name}` image when the node is not in
     * the static AGENTFLOW_ICONS map. If omitted, the fallback img will not
     * produce a valid request — pass it explicitly to support custom nodes.
     */
    apiBaseUrl?: string;
}
/**
 * Renders the type icon for an agentflow node. Falls back to the server-side
 * `${apiBaseUrl}/api/v1/node-icon/{name}` endpoint for nodes not in the static
 * AGENTFLOW_ICONS map (e.g. custom user nodes).
 */
export declare function NodeIcon({ name, size, apiBaseUrl }: NodeIconProps): import("react/jsx-runtime").JSX.Element;
export {};
