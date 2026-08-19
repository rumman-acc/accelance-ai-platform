import { NodeData } from '../../core/types'

/**
 * Renders the icon for an agentflow node based on its name
 */
export declare function renderNodeIcon(node: NodeData): import('react/jsx-runtime').JSX.Element | null
/**
 * Returns the icon component for OpenAI built-in tools
 */
export declare function getBuiltInOpenAIToolIcon(toolName: string): import('react/jsx-runtime').JSX.Element | null
/**
 * Returns the icon component for Gemini built-in tools
 */
export declare function getBuiltInGeminiToolIcon(toolName: string): import('react/jsx-runtime').JSX.Element | null
/**
 * Returns the icon component for Anthropic built-in tools
 */
export declare function getBuiltInAnthropicToolIcon(toolName: string): import('react/jsx-runtime').JSX.Element | null
