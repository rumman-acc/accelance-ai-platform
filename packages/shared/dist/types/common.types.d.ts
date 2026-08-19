export interface IApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface IPaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}
export declare const ENGINE_HEADERS: {
    readonly WORKSPACE_ID: "x-workspace-id";
    readonly TENANT_ID: "x-tenant-id";
    readonly USER_ID: "x-user-id";
    readonly USER_ROLE: "x-user-role";
};
//# sourceMappingURL=common.types.d.ts.map