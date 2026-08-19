import { Request } from 'express';
export declare const getWorkspaceSearchOptions: (workspaceId?: string) => {
    workspaceId: import("typeorm").EqualOperator<string>;
};
export declare const getWorkspaceSearchOptionsFromReq: (req: Request) => {
    workspaceId: import("typeorm").EqualOperator<string>;
};
