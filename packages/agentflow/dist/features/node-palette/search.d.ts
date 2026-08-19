import { NodeDataSchema, groupNodesByCategory } from '../../core'

export { groupNodesByCategory }
/**
 * Calculate fuzzy search score between search term and target text
 * Higher scores indicate better matches
 */
export declare function fuzzyScore(searchTerm: string, text: string): number
/**
 * Score and sort nodes by fuzzy search relevance
 */
export declare function searchNodes(nodes: NodeDataSchema[], searchValue: string): NodeDataSchema[]
/**
 * Debounce function for search input
 */
export declare function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void
