export interface IApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface IPaginatedResponse<T> {
    items: T[]
    total: number
    page: number
    limit: number
}

// Header names injected by apps/api into every engine request
export const ENGINE_HEADERS = {
    WORKSPACE_ID: 'x-workspace-id',
    TENANT_ID: 'x-tenant-id',
    USER_ID: 'x-user-id',
    USER_ROLE: 'x-user-role'
} as const
