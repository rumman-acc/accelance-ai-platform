export interface ITenant {
    id: string
    name: string
    customerId?: string
    subscriptionId?: string
    createdDate: Date
    updatedDate: Date
}

export interface IWorkspace {
    id: string
    name: string
    description?: string
    organizationId: string
    createdDate: Date
    updatedDate: Date
}

export interface IWorkspaceContext {
    tenantId: string
    workspaceId: string
    userId: string
}
