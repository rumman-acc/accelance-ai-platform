import { Request } from 'express';
import { QueryRunner } from 'typeorm';
import { LoggedInUser } from '../Interface.Enterprise';
export declare function getLoggedInUser(req: Request): LoggedInUser;
/**
 * Active workspace for tenant-scoped data access.
 * Interactive sessions use {@link getLoggedInUser} (requires `req.user.id`).
 * API key auth sets `activeWorkspaceId` / `activeOrganizationId` on `req.user` but not `id`.
 */
export declare function getActiveWorkspaceIdForRequest(req: Request): string;
/** When a query supplies organizationId, it must match the caller's active organization. */
export declare function assertQueryOrganizationMatchesActiveOrg(user: LoggedInUser, organizationId: string | undefined): void;
/**
 * Ensures the user may access data for this workspace: same as active workspace, listed in assigned workspaces,
 * or org admin for a workspace that belongs to their active organization.
 */
export declare function assertWorkspaceIdAccessibleToUser(user: LoggedInUser, workspaceId: string | undefined, queryRunner: QueryRunner): Promise<void>;
export declare function assertStripeIdMatchesSession(requestedId: string, activeId: string | undefined): void;
export declare function userMayManageOrgUsers(user: LoggedInUser): boolean;
/** Allows reading a user profile when it is self, or when the caller manages org users and the target belongs to the active org. */
export declare function assertMayReadTargetUser(sessionUser: LoggedInUser, targetUserId: string, queryRunner: QueryRunner): Promise<void>;
