import { DocumentInterface } from '@langchain/core/documents'
import { BaseDocumentLoader } from '@langchain/classic/document_loaders/base'
interface OxylabsLoaderParameters {
    username: string
    password: string
    query: string
    source: string
    geo_location: string
    render: boolean
    parse: boolean
    user_agent_type: string
}
export declare class OxylabsLoader extends BaseDocumentLoader {
    private params
    constructor(loaderParams: OxylabsLoaderParameters)
    private sendAPIRequest
    load(): Promise<DocumentInterface[]>
}
export {}
