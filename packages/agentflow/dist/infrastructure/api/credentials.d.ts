import { ComponentCredentialSchema, CreateCredentialBody, Credential } from '../../core/types'
import { DeduplicatedClient } from './deduplicatedClient'

/**
 * Create credentials API functions bound to a client instance
 */
export declare function bindCredentialsApi(client: DeduplicatedClient): {
    /**
     * Get all credentials
     */
    getAllCredentials: () => Promise<Credential[]>
    /**
     * Get credentials filtered by one or more component credential names.
     */
    getCredentialsByName: (credentialName: string | string[]) => Promise<Credential[]>
    /**
     * Fetch the credential schema (field definitions) for a given component credential name.
     */
    getComponentCredentialSchema: (name: string) => Promise<ComponentCredentialSchema>
    /**
     * Create a new credential.
     */
    createCredential: (body: CreateCredentialBody) => Promise<Credential>
    /**
     * Get a specific credential by ID (includes plainDataObj for editing).
     */
    getCredentialById: (id: string) => Promise<
        Credential & {
            plainDataObj?: Record<string, unknown>
        }
    >
    /**
     * Update an existing credential.
     */
    updateCredential: (id: string, body: CreateCredentialBody) => Promise<Credential>
}
export type CredentialsApi = ReturnType<typeof bindCredentialsApi>
