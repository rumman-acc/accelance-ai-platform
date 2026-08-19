"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const workspace_entity_1 = require("../database/entities/workspace.entity");
const mockReadOrganizationUserByOrganizationIdUserId = globals_1.jest.fn();
globals_1.jest.mock('../services/organization-user.service', () => ({
    OrganizationUserService: globals_1.jest.fn().mockImplementation(() => ({
        readOrganizationUserByOrganizationIdUserId: mockReadOrganizationUserByOrganizationIdUserId
    }))
}));
const tenantRequestGuards_1 = require("./tenantRequestGuards");
function makeLoggedInUser(overrides = {}) {
    return {
        id: 'user-1',
        email: 'a@example.com',
        name: 'Test User',
        roleId: 'role-1',
        activeOrganizationId: 'org-1',
        activeOrganizationSubscriptionId: 'sub-1',
        activeOrganizationCustomerId: 'cus-1',
        activeOrganizationProductId: 'prod-1',
        isOrganizationAdmin: false,
        activeWorkspaceId: 'ws-active',
        activeWorkspace: 'Active WS',
        assignedWorkspaces: [],
        permissions: [],
        ...overrides
    };
}
function makeRequest(user) {
    return { user };
}
function makeQueryRunner(findOneByImpl) {
    const findOneBy = findOneByImpl ?? globals_1.jest.fn();
    return {
        manager: { findOneBy }
    };
}
(0, globals_1.describe)('tenantRequestGuards', () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('getLoggedInUser', () => {
        (0, globals_1.it)('throws UNAUTHORIZED when req.user is missing', () => {
            (0, globals_1.expect)(() => (0, tenantRequestGuards_1.getLoggedInUser)(makeRequest(undefined))).toThrow(internalAccelanceError_1.InternalAccelanceError);
            try {
                (0, tenantRequestGuards_1.getLoggedInUser)(makeRequest(undefined));
            }
            catch (e) {
                (0, globals_1.expect)(e.statusCode).toBe(http_status_codes_1.StatusCodes.UNAUTHORIZED);
                (0, globals_1.expect)(e.message).toBe("Unauthorized" /* GeneralErrorMessage.UNAUTHORIZED */);
            }
        });
        (0, globals_1.it)('throws when id, activeOrganizationId, or activeWorkspaceId is missing', () => {
            (0, globals_1.expect)(() => (0, tenantRequestGuards_1.getLoggedInUser)(makeRequest({ ...makeLoggedInUser(), id: '' }))).toThrow(internalAccelanceError_1.InternalAccelanceError);
            (0, globals_1.expect)(() => (0, tenantRequestGuards_1.getLoggedInUser)(makeRequest({ ...makeLoggedInUser(), activeOrganizationId: '' }))).toThrow(internalAccelanceError_1.InternalAccelanceError);
            (0, globals_1.expect)(() => (0, tenantRequestGuards_1.getLoggedInUser)(makeRequest({ ...makeLoggedInUser(), activeWorkspaceId: '' }))).toThrow(internalAccelanceError_1.InternalAccelanceError);
        });
        (0, globals_1.it)('returns user when session fields are present', () => {
            const user = makeLoggedInUser();
            (0, globals_1.expect)((0, tenantRequestGuards_1.getLoggedInUser)(makeRequest(user))).toBe(user);
        });
    });
    (0, globals_1.describe)('getActiveWorkspaceIdForRequest', () => {
        (0, globals_1.it)('returns activeWorkspaceId for interactive session (user has id)', () => {
            const user = makeLoggedInUser({ activeWorkspaceId: 'ws-int' });
            (0, globals_1.expect)((0, tenantRequestGuards_1.getActiveWorkspaceIdForRequest)(makeRequest(user))).toBe('ws-int');
        });
        (0, globals_1.it)('throws when user has id but session is incomplete', () => {
            (0, globals_1.expect)(() => (0, tenantRequestGuards_1.getActiveWorkspaceIdForRequest)(makeRequest({ id: 'u1', activeOrganizationId: 'org-1', activeWorkspaceId: '' }))).toThrow(internalAccelanceError_1.InternalAccelanceError);
        });
        (0, globals_1.it)('returns workspace id for API-key-style user without id', () => {
            (0, globals_1.expect)((0, tenantRequestGuards_1.getActiveWorkspaceIdForRequest)(makeRequest({
                activeWorkspaceId: 'ws-api',
                activeOrganizationId: 'org-1'
            }))).toBe('ws-api');
        });
        (0, globals_1.it)('throws UNAUTHORIZED when no id and workspace or org is missing', () => {
            (0, globals_1.expect)(() => (0, tenantRequestGuards_1.getActiveWorkspaceIdForRequest)(makeRequest({
                activeWorkspaceId: 'ws-api',
                activeOrganizationId: undefined
            }))).toThrow(internalAccelanceError_1.InternalAccelanceError);
            (0, globals_1.expect)(() => (0, tenantRequestGuards_1.getActiveWorkspaceIdForRequest)(makeRequest({
                activeWorkspaceId: undefined,
                activeOrganizationId: 'org-1'
            }))).toThrow(internalAccelanceError_1.InternalAccelanceError);
        });
    });
    (0, globals_1.describe)('assertQueryOrganizationMatchesActiveOrg', () => {
        const user = makeLoggedInUser({ activeOrganizationId: 'org-1' });
        (0, globals_1.it)('no-ops when organizationId is undefined or empty', () => {
            (0, globals_1.expect)(() => (0, tenantRequestGuards_1.assertQueryOrganizationMatchesActiveOrg)(user, undefined)).not.toThrow();
            (0, globals_1.expect)(() => (0, tenantRequestGuards_1.assertQueryOrganizationMatchesActiveOrg)(user, '')).not.toThrow();
        });
        (0, globals_1.it)('no-ops when organizationId matches active org', () => {
            (0, globals_1.expect)(() => (0, tenantRequestGuards_1.assertQueryOrganizationMatchesActiveOrg)(user, 'org-1')).not.toThrow();
        });
        (0, globals_1.it)('throws FORBIDDEN when organizationId does not match', () => {
            (0, globals_1.expect)(() => (0, tenantRequestGuards_1.assertQueryOrganizationMatchesActiveOrg)(user, 'other-org')).toThrow(internalAccelanceError_1.InternalAccelanceError);
            try {
                (0, tenantRequestGuards_1.assertQueryOrganizationMatchesActiveOrg)(user, 'other-org');
            }
            catch (e) {
                (0, globals_1.expect)(e.statusCode).toBe(http_status_codes_1.StatusCodes.FORBIDDEN);
                (0, globals_1.expect)(e.message).toBe("Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
            }
        });
    });
    (0, globals_1.describe)('assertWorkspaceIdAccessibleToUser', () => {
        (0, globals_1.it)('resolves when workspaceId is undefined or empty', async () => {
            const qr = makeQueryRunner();
            await (0, globals_1.expect)((0, tenantRequestGuards_1.assertWorkspaceIdAccessibleToUser)(makeLoggedInUser(), undefined, qr)).resolves.toBeUndefined();
            await (0, globals_1.expect)((0, tenantRequestGuards_1.assertWorkspaceIdAccessibleToUser)(makeLoggedInUser(), '', qr)).resolves.toBeUndefined();
        });
        (0, globals_1.it)('resolves when workspace is the active workspace', async () => {
            const user = makeLoggedInUser({ activeWorkspaceId: 'ws-1' });
            await (0, globals_1.expect)((0, tenantRequestGuards_1.assertWorkspaceIdAccessibleToUser)(user, 'ws-1', makeQueryRunner())).resolves.toBeUndefined();
        });
        (0, globals_1.it)('resolves when workspace is in assignedWorkspaces', async () => {
            const user = makeLoggedInUser({
                activeWorkspaceId: 'ws-active',
                assignedWorkspaces: [{ id: 'ws-other', name: 'Other', role: 'member', organizationId: 'org-1' }]
            });
            await (0, globals_1.expect)((0, tenantRequestGuards_1.assertWorkspaceIdAccessibleToUser)(user, 'ws-other', makeQueryRunner())).resolves.toBeUndefined();
        });
        (0, globals_1.it)('throws FORBIDDEN when user cannot access workspace', async () => {
            const user = makeLoggedInUser({
                activeWorkspaceId: 'ws-active',
                isOrganizationAdmin: false,
                assignedWorkspaces: []
            });
            await (0, globals_1.expect)((0, tenantRequestGuards_1.assertWorkspaceIdAccessibleToUser)(user, 'ws-remote', makeQueryRunner())).rejects.toThrow(internalAccelanceError_1.InternalAccelanceError);
        });
        (0, globals_1.it)('org admin: resolves when workspace belongs to active organization', async () => {
            const findOneBy = globals_1.jest
                .fn()
                .mockResolvedValue({ id: 'ws-remote', organizationId: 'org-1' });
            const user = makeLoggedInUser({
                activeWorkspaceId: 'ws-active',
                activeOrganizationId: 'org-1',
                isOrganizationAdmin: true,
                assignedWorkspaces: []
            });
            await (0, tenantRequestGuards_1.assertWorkspaceIdAccessibleToUser)(user, 'ws-remote', makeQueryRunner(findOneBy));
            (0, globals_1.expect)(findOneBy).toHaveBeenCalledWith(workspace_entity_1.Workspace, { id: 'ws-remote' });
        });
        (0, globals_1.it)('org admin: throws when workspace is not found', async () => {
            const findOneBy = globals_1.jest.fn().mockResolvedValue(null);
            const user = makeLoggedInUser({ isOrganizationAdmin: true, activeOrganizationId: 'org-1' });
            await (0, globals_1.expect)((0, tenantRequestGuards_1.assertWorkspaceIdAccessibleToUser)(user, 'missing-ws', makeQueryRunner(findOneBy))).rejects.toMatchObject({
                statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                message: "Forbidden" /* GeneralErrorMessage.FORBIDDEN */
            });
        });
        (0, globals_1.it)('org admin: throws when workspace is in another organization', async () => {
            const findOneBy = globals_1.jest
                .fn()
                .mockResolvedValue({ id: 'ws-remote', organizationId: 'org-other' });
            const user = makeLoggedInUser({ isOrganizationAdmin: true, activeOrganizationId: 'org-1' });
            await (0, globals_1.expect)((0, tenantRequestGuards_1.assertWorkspaceIdAccessibleToUser)(user, 'ws-remote', makeQueryRunner(findOneBy))).rejects.toMatchObject({
                statusCode: http_status_codes_1.StatusCodes.FORBIDDEN
            });
        });
    });
    (0, globals_1.describe)('userMayManageOrgUsers', () => {
        (0, globals_1.it)('returns true for organization admin', () => {
            (0, globals_1.expect)((0, tenantRequestGuards_1.userMayManageOrgUsers)(makeLoggedInUser({ isOrganizationAdmin: true }))).toBe(true);
        });
        (0, globals_1.it)('returns true when permissions include users:manage', () => {
            (0, globals_1.expect)((0, tenantRequestGuards_1.userMayManageOrgUsers)(makeLoggedInUser({ isOrganizationAdmin: false, permissions: ['users:manage', 'other:perm'] }))).toBe(true);
        });
        (0, globals_1.it)('returns false without admin or users:manage', () => {
            (0, globals_1.expect)((0, tenantRequestGuards_1.userMayManageOrgUsers)(makeLoggedInUser({ isOrganizationAdmin: false, permissions: ['other:perm'] }))).toBe(false);
            (0, globals_1.expect)((0, tenantRequestGuards_1.userMayManageOrgUsers)(makeLoggedInUser({ isOrganizationAdmin: false, permissions: [] }))).toBe(false);
            (0, globals_1.expect)((0, tenantRequestGuards_1.userMayManageOrgUsers)(makeLoggedInUser({ isOrganizationAdmin: false }))).toBe(false);
        });
    });
    (0, globals_1.describe)('assertMayReadTargetUser', () => {
        const qr = makeQueryRunner();
        (0, globals_1.it)('resolves when reading own profile', async () => {
            const user = makeLoggedInUser({ id: 'user-1' });
            await (0, globals_1.expect)((0, tenantRequestGuards_1.assertMayReadTargetUser)(user, 'user-1', qr)).resolves.toBeUndefined();
            (0, globals_1.expect)(mockReadOrganizationUserByOrganizationIdUserId).not.toHaveBeenCalled();
        });
        (0, globals_1.it)('allows API-key caller without id to read another user when manager and org membership exists', async () => {
            const user = makeLoggedInUser({
                id: undefined,
                isOrganizationAdmin: false,
                permissions: ['users:manage']
            });
            mockReadOrganizationUserByOrganizationIdUserId.mockResolvedValue({ organizationUser: { id: 'ou-1' } });
            await (0, globals_1.expect)((0, tenantRequestGuards_1.assertMayReadTargetUser)(user, 'user-target', qr)).resolves.toBeUndefined();
            (0, globals_1.expect)(mockReadOrganizationUserByOrganizationIdUserId).toHaveBeenCalledWith('org-1', 'user-target', qr);
        });
        (0, globals_1.it)('throws FORBIDDEN when activeOrganizationId is missing', async () => {
            const user = makeLoggedInUser({ activeOrganizationId: '' });
            await (0, globals_1.expect)((0, tenantRequestGuards_1.assertMayReadTargetUser)(user, 'other', qr)).rejects.toMatchObject({
                statusCode: http_status_codes_1.StatusCodes.FORBIDDEN
            });
            (0, globals_1.expect)(mockReadOrganizationUserByOrganizationIdUserId).not.toHaveBeenCalled();
        });
        (0, globals_1.it)('throws FORBIDDEN when caller cannot manage org users', async () => {
            const user = makeLoggedInUser({ id: 'user-1', isOrganizationAdmin: false, permissions: [] });
            await (0, globals_1.expect)((0, tenantRequestGuards_1.assertMayReadTargetUser)(user, 'user-2', qr)).rejects.toMatchObject({
                statusCode: http_status_codes_1.StatusCodes.FORBIDDEN
            });
            (0, globals_1.expect)(mockReadOrganizationUserByOrganizationIdUserId).not.toHaveBeenCalled();
        });
        (0, globals_1.it)('throws FORBIDDEN when target is not in organization', async () => {
            const user = makeLoggedInUser({ isOrganizationAdmin: true });
            mockReadOrganizationUserByOrganizationIdUserId.mockResolvedValue({ organizationUser: null });
            await (0, globals_1.expect)((0, tenantRequestGuards_1.assertMayReadTargetUser)(user, 'stranger', qr)).rejects.toMatchObject({
                statusCode: http_status_codes_1.StatusCodes.FORBIDDEN
            });
        });
        (0, globals_1.it)('resolves when manager and organizationUser exists', async () => {
            const user = makeLoggedInUser({ isOrganizationAdmin: true });
            mockReadOrganizationUserByOrganizationIdUserId.mockResolvedValue({ organizationUser: { id: 'ou-1' } });
            await (0, globals_1.expect)((0, tenantRequestGuards_1.assertMayReadTargetUser)(user, 'user-2', qr)).resolves.toBeUndefined();
        });
    });
});
//# sourceMappingURL=tenantRequestGuards.test.js.map