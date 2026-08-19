import { ChatflowsApi } from './chatflows'
import { CredentialsApi } from './credentials'
import { EmbeddingsApi } from './embeddings'
import { ChatModelsApi } from './models'
import { NodesApi } from './nodes'
import { StoresApi } from './stores'
import { ToolsApi } from './tools'

export interface ApiServices {
    chatflowsApi: ChatflowsApi
    chatModelsApi: ChatModelsApi
    toolsApi: ToolsApi
    credentialsApi: CredentialsApi
    storesApi: StoresApi
    embeddingsApi: EmbeddingsApi
    nodesApi: NodesApi
}
export declare const loadMethodRegistry: Record<string, (_apis: ApiServices, _params?: Record<string, unknown>) => Promise<unknown>>
/**
 * Looks up a load method handler by its string key.
 *
 * If the key is explicitly registered, returns that handler.
 * Otherwise returns a generic fallback that routes the call through
 * `nodesApi.loadNodeMethod(nodeName, name, { currentNode: { inputs } })`,
 * covering any node-specific loadMethod (e.g. `listTopics`, `listBuckets`)
 * without requiring individual registry entries.
 *
 * The fallback rejects if `params.nodeName` is not provided.
 *
 * @param name - The `loadMethod` key declared on a node `InputParam`
 */
export declare function getLoadMethod(name: string): (_apis: ApiServices, _params?: Record<string, unknown>) => Promise<unknown>
