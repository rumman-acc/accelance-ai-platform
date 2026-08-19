"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = exports.PermissionCategory = exports.Permissions = void 0;
class Permissions {
    constructor() {
        // const auditCategory = new PermissionCategory('audit')
        // auditCategory.addPermission(new Permission('auditLogs:view', 'View Audit Logs'))
        // this.categories.push(auditCategory)
        this.categories = [];
        const chatflowsCategory = new PermissionCategory('chatflows');
        chatflowsCategory.addPermission(new Permission('chatflows:view', 'View', true, true, true));
        chatflowsCategory.addPermission(new Permission('chatflows:create', 'Create', true, true, true));
        chatflowsCategory.addPermission(new Permission('chatflows:update', 'Update', true, true, true));
        chatflowsCategory.addPermission(new Permission('chatflows:duplicate', 'Duplicate', true, true, true));
        chatflowsCategory.addPermission(new Permission('chatflows:delete', 'Delete', true, true, true));
        chatflowsCategory.addPermission(new Permission('chatflows:export', 'Export', true, true, true));
        chatflowsCategory.addPermission(new Permission('chatflows:import', 'Import', true, true, true));
        chatflowsCategory.addPermission(new Permission('chatflows:config', 'Edit Configuration', true, true, true));
        chatflowsCategory.addPermission(new Permission('chatflows:domains', 'Allowed Domains', true, true, true));
        this.categories.push(chatflowsCategory);
        const agentflowsCategory = new PermissionCategory('agentflows');
        agentflowsCategory.addPermission(new Permission('agentflows:view', 'View', true, true, true));
        agentflowsCategory.addPermission(new Permission('agentflows:create', 'Create', true, true, true));
        agentflowsCategory.addPermission(new Permission('agentflows:update', 'Update', true, true, true));
        agentflowsCategory.addPermission(new Permission('agentflows:duplicate', 'Duplicate', true, true, true));
        agentflowsCategory.addPermission(new Permission('agentflows:delete', 'Delete', true, true, true));
        agentflowsCategory.addPermission(new Permission('agentflows:export', 'Export', true, true, true));
        agentflowsCategory.addPermission(new Permission('agentflows:import', 'Import', true, true, true));
        agentflowsCategory.addPermission(new Permission('agentflows:config', 'Edit Configuration', true, true, true));
        agentflowsCategory.addPermission(new Permission('agentflows:domains', 'Allowed Domains', true, true, true));
        this.categories.push(agentflowsCategory);
        const toolsCategory = new PermissionCategory('tools');
        toolsCategory.addPermission(new Permission('tools:view', 'View', true, true, true));
        toolsCategory.addPermission(new Permission('tools:create', 'Create', true, true, true));
        toolsCategory.addPermission(new Permission('tools:update', 'Update', true, true, true));
        toolsCategory.addPermission(new Permission('tools:delete', 'Delete', true, true, true));
        toolsCategory.addPermission(new Permission('tools:export', 'Export', true, true, true));
        toolsCategory.addPermission(new Permission('tools:manage-policy', 'Manage Tool Access Policy', false, true, true));
        this.categories.push(toolsCategory);
        const guardrailsCategory = new PermissionCategory('guardrails');
        guardrailsCategory.addPermission(new Permission('guardrails:view', 'View Guardrails & Compliance', true, true, true));
        guardrailsCategory.addPermission(new Permission('guardrails:manage', 'Manage Guardrails & Compliance', false, true, true));
        this.categories.push(guardrailsCategory);
        const assistantsCategory = new PermissionCategory('assistants');
        assistantsCategory.addPermission(new Permission('assistants:view', 'View', true, true, true));
        assistantsCategory.addPermission(new Permission('assistants:create', 'Create', true, true, true));
        assistantsCategory.addPermission(new Permission('assistants:update', 'Update', true, true, true));
        assistantsCategory.addPermission(new Permission('assistants:delete', 'Delete', true, true, true));
        this.categories.push(assistantsCategory);
        const credentialsCategory = new PermissionCategory('credentials');
        credentialsCategory.addPermission(new Permission('credentials:view', 'View', true, true, true));
        credentialsCategory.addPermission(new Permission('credentials:create', 'Create', true, true, true));
        credentialsCategory.addPermission(new Permission('credentials:update', 'Update', true, true, true));
        credentialsCategory.addPermission(new Permission('credentials:delete', 'Delete', true, true, true));
        credentialsCategory.addPermission(new Permission('credentials:share', 'Share', false, true, true));
        credentialsCategory.addPermission(new Permission('credentials:manage-access', 'Manage User Access', false, true, true));
        this.categories.push(credentialsCategory);
        const variablesCategory = new PermissionCategory('variables');
        variablesCategory.addPermission(new Permission('variables:view', 'View', true, true, true));
        variablesCategory.addPermission(new Permission('variables:create', 'Create', true, true, true));
        variablesCategory.addPermission(new Permission('variables:update', 'Update', true, true, true));
        variablesCategory.addPermission(new Permission('variables:delete', 'Delete', true, true, true));
        this.categories.push(variablesCategory);
        const apikeysCategory = new PermissionCategory('apikeys');
        apikeysCategory.addPermission(new Permission('apikeys:view', 'View', true, true, true));
        apikeysCategory.addPermission(new Permission('apikeys:create', 'Create', true, true, true));
        apikeysCategory.addPermission(new Permission('apikeys:update', 'Update', true, true, true));
        apikeysCategory.addPermission(new Permission('apikeys:delete', 'Delete', true, true, true));
        this.categories.push(apikeysCategory);
        const documentStoresCategory = new PermissionCategory('documentStores');
        documentStoresCategory.addPermission(new Permission('documentStores:view', 'View', true, true, true));
        documentStoresCategory.addPermission(new Permission('documentStores:create', 'Create', true, true, true));
        documentStoresCategory.addPermission(new Permission('documentStores:update', 'Update', true, true, true));
        documentStoresCategory.addPermission(new Permission('documentStores:delete', 'Delete Document Store', true, true, true));
        documentStoresCategory.addPermission(new Permission('documentStores:add-loader', 'Add Document Loader', true, true, true));
        documentStoresCategory.addPermission(new Permission('documentStores:delete-loader', 'Delete Document Loader', true, true, true));
        documentStoresCategory.addPermission(new Permission('documentStores:preview-process', 'Preview & Process Document Chunks', true, true, true));
        documentStoresCategory.addPermission(new Permission('documentStores:upsert-config', 'Upsert Config', true, true, true));
        this.categories.push(documentStoresCategory);
        const datasetsCategory = new PermissionCategory('datasets');
        datasetsCategory.addPermission(new Permission('datasets:view', 'View', false, true, true));
        datasetsCategory.addPermission(new Permission('datasets:create', 'Create', false, true, true));
        datasetsCategory.addPermission(new Permission('datasets:update', 'Update', false, true, true));
        datasetsCategory.addPermission(new Permission('datasets:delete', 'Delete', false, true, true));
        this.categories.push(datasetsCategory);
        const executionsCategory = new PermissionCategory('executions');
        executionsCategory.addPermission(new Permission('executions:view', 'View', true, true, true));
        executionsCategory.addPermission(new Permission('executions:update', 'Update', true, true, true));
        executionsCategory.addPermission(new Permission('executions:delete', 'Delete', true, true, true));
        this.categories.push(executionsCategory);
        const evaluatorsCategory = new PermissionCategory('evaluators');
        evaluatorsCategory.addPermission(new Permission('evaluators:view', 'View', false, true, true));
        evaluatorsCategory.addPermission(new Permission('evaluators:create', 'Create', false, true, true));
        evaluatorsCategory.addPermission(new Permission('evaluators:update', 'Update', false, true, true));
        evaluatorsCategory.addPermission(new Permission('evaluators:delete', 'Delete', false, true, true));
        this.categories.push(evaluatorsCategory);
        const evaluationsCategory = new PermissionCategory('evaluations');
        evaluationsCategory.addPermission(new Permission('evaluations:view', 'View', false, true, true));
        evaluationsCategory.addPermission(new Permission('evaluations:create', 'Create', false, true, true));
        evaluationsCategory.addPermission(new Permission('evaluations:update', 'Update', false, true, true));
        evaluationsCategory.addPermission(new Permission('evaluations:delete', 'Delete', false, true, true));
        evaluationsCategory.addPermission(new Permission('evaluations:run', 'Run Again', false, true, true));
        this.categories.push(evaluationsCategory);
        const templatesCategory = new PermissionCategory('templates');
        templatesCategory.addPermission(new Permission('templates:marketplace', 'View Marketplace Templates', true, true, true));
        templatesCategory.addPermission(new Permission('templates:custom', 'View Custom Templates', true, true, true));
        templatesCategory.addPermission(new Permission('templates:custom-delete', 'Delete Custom Template', true, true, true));
        templatesCategory.addPermission(new Permission('templates:toolexport', 'Export Tool as Template', true, true, true));
        templatesCategory.addPermission(new Permission('templates:flowexport', 'Export Flow as Template', true, true, true));
        templatesCategory.addPermission(new Permission('templates:custom-share', 'Share Custom Templates', false, true, true));
        this.categories.push(templatesCategory);
        const workspaceCategory = new PermissionCategory('workspace');
        workspaceCategory.addPermission(new Permission('workspace:view', 'View', false, true, true));
        workspaceCategory.addPermission(new Permission('workspace:create', 'Create', false, true, true));
        workspaceCategory.addPermission(new Permission('workspace:update', 'Update', false, true, true));
        workspaceCategory.addPermission(new Permission('workspace:add-user', 'Add User', false, true, true));
        workspaceCategory.addPermission(new Permission('workspace:unlink-user', 'Remove User', false, true, true));
        workspaceCategory.addPermission(new Permission('workspace:delete', 'Delete', false, true, true));
        workspaceCategory.addPermission(new Permission('workspace:export', 'Export Data within Workspace', false, true, true));
        workspaceCategory.addPermission(new Permission('workspace:import', 'Import Data within Workspace', false, true, true));
        this.categories.push(workspaceCategory);
        const adminCategory = new PermissionCategory('admin');
        adminCategory.addPermission(new Permission('users:manage', 'Manage Users', false, true, true));
        adminCategory.addPermission(new Permission('roles:manage', 'Manage Roles', false, true, true));
        adminCategory.addPermission(new Permission('sso:manage', 'Manage SSO', false, true, false));
        this.categories.push(adminCategory);
        const loginActivityCategory = new PermissionCategory('loginActivity');
        loginActivityCategory.addPermission(new Permission('loginActivity:view', 'View Login Activity', false, true, false));
        this.categories.push(loginActivityCategory);
    }
    toJSON() {
        return this.categories.reduce((acc, category) => {
            return {
                ...acc,
                ...category.toJSON()
            };
        }, {});
    }
}
exports.Permissions = Permissions;
class PermissionCategory {
    constructor(category) {
        this.category = category;
        this.permissions = [];
    }
    addPermission(permission) {
        this.permissions.push(permission);
    }
    toJSON() {
        return {
            [this.category]: [...this.permissions.map((permission) => permission.toJSON())]
        };
    }
}
exports.PermissionCategory = PermissionCategory;
class Permission {
    constructor(name, description, isOpenSource = false, isEnterprise = false, isCloud = false) {
        this.name = name;
        this.description = description;
        this.isOpenSource = isOpenSource;
        this.isEnterprise = isEnterprise;
        this.isCloud = isCloud;
    }
    toJSON() {
        return {
            key: this.name,
            value: this.description,
            isOpenSource: this.isOpenSource,
            isEnterprise: this.isEnterprise,
            isCloud: this.isCloud
        };
    }
}
exports.Permission = Permission;
//# sourceMappingURL=Permissions.js.map