import { DynamicStructuredTool } from '../OpenAPIToolkit/core';
interface TeamsToolOptions {
    accessToken: string;
    actions: string[];
    defaultParams: any;
    type: string;
}
export declare function createTeamsTools(options: TeamsToolOptions): DynamicStructuredTool[];
export {};
