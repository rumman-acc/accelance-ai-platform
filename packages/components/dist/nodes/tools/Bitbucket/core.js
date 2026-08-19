"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBitbucketTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access Bitbucket API for managing repositories, pull requests, and issues`;
const BITBUCKET_BASE_URL = 'https://api.bitbucket.org/2.0';
// Define schemas for different Bitbucket operations
const ListRepositoriesSchema = v3_1.z.object({
    workspace: v3_1.z.string().describe('Workspace ID or slug')
});
const GetRepositorySchema = v3_1.z.object({
    workspace: v3_1.z.string().describe('Workspace ID or slug'),
    repoSlug: v3_1.z.string().describe('Repository slug')
});
const ListPullRequestsSchema = v3_1.z.object({
    workspace: v3_1.z.string().describe('Workspace ID or slug'),
    repoSlug: v3_1.z.string().describe('Repository slug')
});
const CreatePullRequestSchema = v3_1.z.object({
    workspace: v3_1.z.string().describe('Workspace ID or slug'),
    repoSlug: v3_1.z.string().describe('Repository slug'),
    title: v3_1.z.string().describe('Title of the pull request'),
    sourceBranch: v3_1.z.string().describe('Name of the source branch'),
    destinationBranch: v3_1.z.string().describe('Name of the destination branch')
});
const ListIssuesSchema = v3_1.z.object({
    workspace: v3_1.z.string().describe('Workspace ID or slug'),
    repoSlug: v3_1.z.string().describe('Repository slug')
});
class BaseBitbucketTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.username = '';
        this.appPassword = '';
        this.username = args.username ?? '';
        this.appPassword = args.appPassword ?? '';
        this.authConfig = args.authConfig;
    }
    async makeBitbucketRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${BITBUCKET_BASE_URL}${endpoint}`;
        const username = this.authConfig?.username ?? this.username;
        const appPassword = this.authConfig?.appPassword ?? this.appPassword;
        const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
        const authHeader = `Basic ${auth}`;
        const headers = {
            Authorization: authHeader,
            'Content-Type': 'application/json',
            ...this.headers
        };
        const fetchOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        };
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Bitbucket API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class ListRepositoriesTool extends BaseBitbucketTool {
    constructor(args) {
        const toolInput = {
            name: 'list_repositories',
            description: 'List repositories in a Bitbucket workspace',
            schema: ListRepositoriesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            appPassword: args.appPassword,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/repositories/${params.workspace}`;
            const response = await this.makeBitbucketRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing repositories: ${error}`, params);
        }
    }
}
class GetRepositoryTool extends BaseBitbucketTool {
    constructor(args) {
        const toolInput = {
            name: 'get_repository',
            description: 'Get a specific repository from Bitbucket',
            schema: GetRepositorySchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            appPassword: args.appPassword,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/repositories/${params.workspace}/${params.repoSlug}`;
            const response = await this.makeBitbucketRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting repository: ${error}`, params);
        }
    }
}
class ListPullRequestsTool extends BaseBitbucketTool {
    constructor(args) {
        const toolInput = {
            name: 'list_pull_requests',
            description: 'List pull requests for a Bitbucket repository',
            schema: ListPullRequestsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            appPassword: args.appPassword,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/repositories/${params.workspace}/${params.repoSlug}/pullrequests`;
            const response = await this.makeBitbucketRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing pull requests: ${error}`, params);
        }
    }
}
class CreatePullRequestTool extends BaseBitbucketTool {
    constructor(args) {
        const toolInput = {
            name: 'create_pull_request',
            description: 'Create a new pull request in a Bitbucket repository',
            schema: CreatePullRequestSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            appPassword: args.appPassword,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const prData = {
                title: params.title,
                source: {
                    branch: {
                        name: params.sourceBranch
                    }
                },
                destination: {
                    branch: {
                        name: params.destinationBranch
                    }
                }
            };
            const endpoint = `/repositories/${params.workspace}/${params.repoSlug}/pullrequests`;
            const response = await this.makeBitbucketRequest({ endpoint, method: 'POST', body: prData, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating pull request: ${error}`, params);
        }
    }
}
class ListIssuesTool extends BaseBitbucketTool {
    constructor(args) {
        const toolInput = {
            name: 'list_issues',
            description: 'List issues for a Bitbucket repository',
            schema: ListIssuesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            username: args.username,
            appPassword: args.appPassword,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/repositories/${params.workspace}/${params.repoSlug}/issues`;
            const response = await this.makeBitbucketRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing issues: ${error}`, params);
        }
    }
}
const createBitbucketTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const username = args?.username || '';
    const appPassword = args?.appPassword || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const defaultParams = args?.defaultParams || {};
    const authConfig = args?.authConfig;
    if (actions.includes('list_repositories')) {
        tools.push(new ListRepositoriesTool({
            username,
            appPassword,
            maxOutputLength,
            defaultParams,
            authConfig
        }));
    }
    if (actions.includes('get_repository')) {
        tools.push(new GetRepositoryTool({
            username,
            appPassword,
            maxOutputLength,
            defaultParams,
            authConfig
        }));
    }
    if (actions.includes('list_pull_requests')) {
        tools.push(new ListPullRequestsTool({
            username,
            appPassword,
            maxOutputLength,
            defaultParams,
            authConfig
        }));
    }
    if (actions.includes('create_pull_request')) {
        tools.push(new CreatePullRequestTool({
            username,
            appPassword,
            maxOutputLength,
            defaultParams,
            authConfig
        }));
    }
    if (actions.includes('list_issues')) {
        tools.push(new ListIssuesTool({
            username,
            appPassword,
            maxOutputLength,
            defaultParams,
            authConfig
        }));
    }
    return tools;
};
exports.createBitbucketTools = createBitbucketTools;
//# sourceMappingURL=core.js.map