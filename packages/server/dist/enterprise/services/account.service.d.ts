import { QueryRunner } from 'typeorm';
import { OrganizationUser } from '../database/entities/organization-user.entity';
import { Organization } from '../database/entities/organization.entity';
import { Role } from '../database/entities/role.entity';
import { User } from '../database/entities/user.entity';
import { WorkspaceUser } from '../database/entities/workspace-user.entity';
import { Workspace } from '../database/entities/workspace.entity';
import { LoggedInUser } from '../Interface.Enterprise';
/** Optional referral field for Stripe referral tracking in CLOUD; not a User entity column. */
type RegistrationUser = Partial<User> & {
    referral?: string;
};
export type AccountDTO = {
    user: RegistrationUser;
    organization: Partial<Organization>;
    organizationUser: Partial<OrganizationUser>;
    workspace: Partial<Workspace>;
    workspaceUser: Partial<WorkspaceUser>;
    role: Partial<Role>;
};
export declare class AccountService {
    private dataSource;
    private userService;
    private organizationservice;
    private workspaceService;
    private roleService;
    private organizationUserService;
    private workspaceUserService;
    private identityManager;
    constructor();
    /** Cloud always sends; open source / enterprise require SMTP to be configured. */
    private canSendTransactionalEmail;
    private sendInviteEmailIfAllowed;
    /** Prevents email-change JWTs from being consumed by verify / reset-password flows. */
    private assertNotEmailChangeJwt;
    private initializeAccountDTO;
    resendVerificationEmail({ email }: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    private createRegisterAccount;
    private saveRegisterAccount;
    register(data: AccountDTO): Promise<AccountDTO>;
    private saveInviteAccount;
    invite(data: AccountDTO, user?: Express.User): Promise<AccountDTO>;
    login(data: AccountDTO): Promise<{
        user: Partial<User>;
        workspaceDetails: {
            isOrgOwner: boolean;
            workspaceId: string;
            workspace: Workspace;
            userId: string;
            user: User;
            roleId: string;
            role?: Role;
            status?: string;
            lastLogin?: string;
            createdDate?: Date;
            updatedDate?: Date;
            createdBy?: string;
            createdByUser?: User;
            updatedBy?: string;
            updatedByUser?: User;
        };
    }>;
    verify(data: AccountDTO): Promise<AccountDTO>;
    forgotPassword(data: AccountDTO): Promise<{
        message: string;
    }>;
    resetPassword(data: AccountDTO): Promise<{
        message: string;
    }>;
    logout(user: LoggedInUser): Promise<void>;
    /**
     * Permanently deletes the logged-in user's account and all associated organization and workspace data.
     *
     * Only allowed on CLOUD platform. Validates that the user is the sole organization owner and that
     * the organization has a subscription, then runs a transaction that removes organization and
     * workspace memberships, deletes all workspace resources (chatflows, documents, evaluations,
     * datasets, etc.), anonymizes the user record for GDPR, cancels the Stripe subscription, removes
     * organization storage, and emits an audit event. Throws on validation failure or if the user is
     * not found.
     *
     * @param queryRunner - TypeORM query runner for the database transaction
     * @param loggedInUser - The authenticated user requesting account deletion
     * @param ipAddress - Client IP address (e.g. for audit/telemetry)
     * @returns A promise that resolves when deletion and cleanup complete, or rejects with an error
     */
    delete(queryRunner: QueryRunner, loggedInUser: LoggedInUser, ipAddress: string): Promise<void>;
    initiateEmailChange(userId: string, newEmail: string): Promise<void>;
    confirmEmailChange(data: {
        user: {
            tempToken?: string;
        };
    }): Promise<{
        message: string;
    }>;
    updateAuthenticatedUserProfile(currentUserId: string, body: Partial<User> & {
        oldPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
    }, onEmailChanged: (userId: string, newEmail: string) => Promise<void>): Promise<{
        user: Partial<User>;
        emailChangePending: boolean;
        pendingEmail: string;
    } | {
        user: Partial<User>;
        emailChangePending?: undefined;
        pendingEmail?: undefined;
    }>;
    /**
     * Sync Stripe customer email when user changes their email (CLOUD only).
     * Expects exactly one org where the user is org owner; updates that org's Stripe customer email.
     */
    syncStripeCustomerEmailAfterUserEmailChange(userId: string, newEmail: string): Promise<void>;
}
export {};
