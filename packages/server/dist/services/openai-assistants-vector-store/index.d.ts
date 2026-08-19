import OpenAI from 'openai';
declare const _default: {
    getAssistantVectorStore: (credentialId: string, vectorStoreId: string, workspaceId: string) => Promise<OpenAI.VectorStores.VectorStore & {
        _request_id?: string | null;
    }>;
    listAssistantVectorStore: (credentialId: string, workspaceId: string) => Promise<OpenAI.VectorStores.VectorStore[]>;
    createAssistantVectorStore: (credentialId: string, obj: OpenAI.VectorStores.VectorStoreCreateParams, workspaceId: string) => Promise<OpenAI.VectorStores.VectorStore & {
        _request_id?: string | null;
    }>;
    updateAssistantVectorStore: (credentialId: string, vectorStoreId: string, obj: OpenAI.VectorStores.VectorStoreUpdateParams, workspaceId: string) => Promise<OpenAI.VectorStores.VectorStore & {
        _request_id?: string | null;
    }>;
    deleteAssistantVectorStore: (credentialId: string, vectorStoreId: string, workspaceId: string) => Promise<OpenAI.VectorStores.VectorStoreDeleted & {
        _request_id?: string | null;
    }>;
    uploadFilesToAssistantVectorStore: (credentialId: string, vectorStoreId: string, files: {
        filePath: string;
        fileName: string;
    }[], workspaceId: string) => Promise<any>;
    deleteFilesFromAssistantVectorStore: (credentialId: string, vectorStoreId: string, file_ids: string[], workspaceId: string) => Promise<{
        deletedFileIds: string[];
        count: number;
    }>;
};
export default _default;
