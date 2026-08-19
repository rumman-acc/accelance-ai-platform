"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const accelance_components_1 = require("accelance-components");
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const moment_1 = __importDefault(require("moment"));
const typeorm_1 = require("typeorm");
const ApiKey_1 = require("../../database/entities/ApiKey");
const Assistant_1 = require("../../database/entities/Assistant");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const ChatMessage_1 = require("../../database/entities/ChatMessage");
const ChatMessageFeedback_1 = require("../../database/entities/ChatMessageFeedback");
const Credential_1 = require("../../database/entities/Credential");
const CustomTemplate_1 = require("../../database/entities/CustomTemplate");
const Dataset_1 = require("../../database/entities/Dataset");
const DatasetRow_1 = require("../../database/entities/DatasetRow");
const DocumentStore_1 = require("../../database/entities/DocumentStore");
const DocumentStoreFileChunk_1 = require("../../database/entities/DocumentStoreFileChunk");
const Evaluation_1 = require("../../database/entities/Evaluation");
const EvaluationRun_1 = require("../../database/entities/EvaluationRun");
const Evaluator_1 = require("../../database/entities/Evaluator");
const Execution_1 = require("../../database/entities/Execution");
const Lead_1 = require("../../database/entities/Lead");
const Tool_1 = require("../../database/entities/Tool");
const UpsertHistory_1 = require("../../database/entities/UpsertHistory");
const Variable_1 = require("../../database/entities/Variable");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const Interface_1 = require("../../Interface");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const logger_1 = __importDefault(require("../../utils/logger"));
const quotaUsage_1 = require("../../utils/quotaUsage");
const sanitize_util_1 = require("../../utils/sanitize.util");
const telemetry_1 = require("../../utils/telemetry");
const EnterpriseEntities_1 = require("../database/entities/EnterpriseEntities");
const organization_user_entity_1 = require("../database/entities/organization-user.entity");
const organization_entity_1 = require("../database/entities/organization.entity");
const role_entity_1 = require("../database/entities/role.entity");
const user_entity_1 = require("../database/entities/user.entity");
const workspace_user_entity_1 = require("../database/entities/workspace-user.entity");
const workspace_entity_1 = require("../database/entities/workspace.entity");
const Interface_Enterprise_1 = require("../Interface.Enterprise");
const SessionPersistance_1 = require("../middleware/passport/SessionPersistance");
const authSecrets_1 = require("../utils/authSecrets");
const emailChangeJwt_util_1 = require("../utils/emailChangeJwt.util");
const encryption_util_1 = require("../utils/encryption.util");
const sendEmail_1 = require("../utils/sendEmail");
const tempTokenUtils_1 = require("../utils/tempTokenUtils");
const url_util_1 = require("../utils/url.util");
const validation_util_1 = require("../utils/validation.util");
const audit_1 = __importDefault(require("./audit"));
const organization_user_service_1 = require("./organization-user.service");
const organization_service_1 = require("./organization.service");
const role_service_1 = require("./role.service");
const user_service_1 = require("./user.service");
const workspace_user_service_1 = require("./workspace-user.service");
const workspace_service_1 = require("./workspace.service");
class AccountService {
    constructor() {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        this.dataSource = appServer.AppDataSource;
        this.userService = new user_service_1.UserService();
        this.organizationservice = new organization_service_1.OrganizationService();
        this.workspaceService = new workspace_service_1.WorkspaceService();
        this.roleService = new role_service_1.RoleService();
        this.organizationUserService = new organization_user_service_1.OrganizationUserService();
        this.workspaceUserService = new workspace_user_service_1.WorkspaceUserService();
        this.identityManager = appServer.identityManager;
    }
    /** Cloud always sends; open source / enterprise require SMTP to be configured. */
    canSendTransactionalEmail() {
        return this.identityManager.getPlatformType() === Interface_1.Platform.CLOUD || (0, sendEmail_1.isSmtpConfigured)();
    }
    async sendInviteEmailIfAllowed(send, context) {
        console.log(`[email] sendInviteEmailIfAllowed context="${context}" canSend=${this.canSendTransactionalEmail()}`);
        if (this.canSendTransactionalEmail()) {
            await send();
        }
        else {
            logger_1.default.warn(`Skipping transactional email (${context}): SMTP is not configured`);
        }
    }
    /** Prevents email-change JWTs from being consumed by verify / reset-password flows. */
    assertNotEmailChangeJwt(token) {
        if (!(0, emailChangeJwt_util_1.isEmailChangeJwtShape)(token))
            return;
        try {
            const payload = jsonwebtoken_1.default.verify(token, (0, authSecrets_1.getJWTAuthTokenSecret)());
            if (payload.typ === emailChangeJwt_util_1.EMAIL_CHANGE_JWT_TYP) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Use the confirm email change link from your email to complete this action." /* UserErrorMessage.EMAIL_CHANGE_USE_CONFIRM_LINK */);
            }
        }
        catch (err) {
            if (err instanceof internalAccelanceError_1.InternalAccelanceError)
                throw err;
        }
    }
    initializeAccountDTO(data) {
        data.organization = data.organization || {};
        data.organizationUser = data.organizationUser || {};
        data.workspace = data.workspace || {};
        data.workspaceUser = data.workspaceUser || {};
        data.role = data.role || {};
        return data;
    }
    async resendVerificationEmail({ email }) {
        if (!this.canSendTransactionalEmail()) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email (SMTP) is not configured on this server" /* GeneralErrorMessage.SMTP_NOT_CONFIGURED */);
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            await queryRunner.startTransaction();
            const user = await this.userService.readUserByEmail(email, queryRunner);
            if (!user)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            if (user && user.status === user_entity_1.UserStatus.ACTIVE)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Email Already Exists" /* UserErrorMessage.USER_EMAIL_ALREADY_EXISTS */);
            if (!user.email)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Email" /* UserErrorMessage.INVALID_USER_EMAIL */);
            const updateUserData = {};
            updateUserData.tempToken = (0, tempTokenUtils_1.generateTempToken)();
            const tokenExpiry = new Date();
            const expiryInHours = process.env.INVITE_TOKEN_EXPIRY_IN_HOURS ? parseInt(process.env.INVITE_TOKEN_EXPIRY_IN_HOURS) : 24;
            tokenExpiry.setHours(tokenExpiry.getHours() + expiryInHours);
            updateUserData.tokenExpiry = tokenExpiry;
            // Update user with new token and expiry
            const updatedUser = queryRunner.manager.merge(user_entity_1.User, user, updateUserData);
            await queryRunner.manager.save(user_entity_1.User, updatedUser);
            // resend invite
            const verificationLink = (0, url_util_1.getSecureTokenLink)('/verify', updateUserData.tempToken);
            await (0, sendEmail_1.sendVerificationEmailForCloud)(email, verificationLink);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return { message: 'success' };
    }
    async createRegisterAccount(data, queryRunner) {
        data = this.initializeAccountDTO(data);
        const platform = this.identityManager.getPlatformType();
        switch (platform) {
            case Interface_1.Platform.OPEN_SOURCE:
                data.organization.name = organization_entity_1.OrganizationName.DEFAULT_ORGANIZATION;
                data.organizationUser.role = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
                data.workspace.name = workspace_entity_1.WorkspaceName.DEFAULT_WORKSPACE;
                data.workspaceUser.role = data.organizationUser.role;
                data.user.status = user_entity_1.UserStatus.ACTIVE;
                data.user = await this.userService.createNewUser(data.user, queryRunner);
                break;
            case Interface_1.Platform.CLOUD: {
                const user = await this.userService.readUserByEmail(data.user.email, queryRunner);
                if (user && (user.status === user_entity_1.UserStatus.ACTIVE || user.status === user_entity_1.UserStatus.UNVERIFIED))
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Email Already Exists" /* UserErrorMessage.USER_EMAIL_ALREADY_EXISTS */);
                if (!data.user.email)
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Email" /* UserErrorMessage.INVALID_USER_EMAIL */);
                const { customerId, subscriptionId } = await this.identityManager.createStripeUserAndSubscribe({
                    email: data.user.email,
                    userPlan: Interface_1.UserPlan.FREE,
                    referral: data.user.referral || ''
                });
                data.organization.customerId = customerId;
                data.organization.subscriptionId = subscriptionId;
                // if credential exists then the user is signing up with email/password
                // if not then the user is signing up with oauth/sso
                if (data.user.credential) {
                    data.user.status = user_entity_1.UserStatus.UNVERIFIED;
                    data.user.tempToken = (0, tempTokenUtils_1.generateTempToken)();
                    const tokenExpiry = new Date();
                    const expiryInHours = process.env.INVITE_TOKEN_EXPIRY_IN_HOURS ? parseInt(process.env.INVITE_TOKEN_EXPIRY_IN_HOURS) : 24;
                    tokenExpiry.setHours(tokenExpiry.getHours() + expiryInHours);
                    data.user.tokenExpiry = tokenExpiry;
                }
                else {
                    data.user.status = user_entity_1.UserStatus.ACTIVE;
                    data.user.tempToken = '';
                    data.user.tokenExpiry = null;
                }
                data.organization.name = organization_entity_1.OrganizationName.DEFAULT_ORGANIZATION;
                data.organizationUser.role = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
                data.workspace.name = workspace_entity_1.WorkspaceName.DEFAULT_WORKSPACE;
                data.workspaceUser.role = data.organizationUser.role;
                if (!user) {
                    data.user = await this.userService.createNewUser(data.user, queryRunner);
                }
                else {
                    if (data.user.credential)
                        data.user.credential = this.userService.encryptUserCredential(data.user.credential);
                    data.user.updatedBy = user.id;
                    data.user = queryRunner.manager.merge(user_entity_1.User, user, data.user);
                }
                // send verification email only if user signed up with email/password
                if (data.user.credential) {
                    const verificationLink = (0, url_util_1.getSecureTokenLink)('/verify', data.user.tempToken);
                    await (0, sendEmail_1.sendVerificationEmailForCloud)(data.user.email, verificationLink);
                }
                break;
            }
            case Interface_1.Platform.ENTERPRISE: {
                if (data.user.tempToken) {
                    const user = await this.userService.readUserByToken(data.user.tempToken, queryRunner);
                    if (!user)
                        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
                    if (user.email.toLowerCase() !== data.user.email?.toLowerCase())
                        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Email" /* UserErrorMessage.INVALID_USER_EMAIL */);
                    const name = data.user.name;
                    if (data.user.credential)
                        user.credential = this.userService.encryptUserCredential(data.user.credential);
                    data.user = user;
                    const organizationUser = await this.organizationUserService.readOrganizationUserByUserId(user.id, queryRunner);
                    if (!organizationUser)
                        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization User Not Found" /* OrganizationUserErrorMessage.ORGANIZATION_USER_NOT_FOUND */);
                    const assignedOrganization = await this.organizationservice.readOrganizationById(organizationUser[0].organizationId, queryRunner);
                    if (!assignedOrganization)
                        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
                    data.organization = assignedOrganization;
                    const tokenExpiry = new Date(user.tokenExpiry);
                    const today = new Date();
                    if (today > tokenExpiry)
                        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Expired Temporary Token" /* UserErrorMessage.EXPIRED_TEMP_TOKEN */);
                    data.user.tempToken = '';
                    data.user.tokenExpiry = null;
                    data.user.name = name;
                    data.user.status = user_entity_1.UserStatus.ACTIVE;
                    data.organizationUser.status = organization_user_entity_1.OrganizationUserStatus.ACTIVE;
                    data.organizationUser.role = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.MEMBER, queryRunner);
                    data.workspace.name = workspace_entity_1.WorkspaceName.DEFAULT_PERSONAL_WORKSPACE;
                    data.workspaceUser.role = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.PERSONAL_WORKSPACE, queryRunner);
                }
                else {
                    data.organizationUser.role = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
                    data.workspace.name = workspace_entity_1.WorkspaceName.DEFAULT_WORKSPACE;
                    data.workspaceUser.role = data.organizationUser.role;
                    // Require email verification before a brand-new Enterprise org's owner can log
                    // in, mirroring the Cloud self-serve flow above — only when SMTP is actually
                    // configured, since an Enterprise deployment without it can't send the email at
                    // all. Open Source (the OPEN_SOURCE case above) is untouched by this branch and
                    // keeps its "no external connections" guarantee.
                    if (this.canSendTransactionalEmail()) {
                        data.user.status = user_entity_1.UserStatus.UNVERIFIED;
                        data.user.tempToken = (0, tempTokenUtils_1.generateTempToken)();
                        const tokenExpiry = new Date();
                        const expiryInHours = process.env.INVITE_TOKEN_EXPIRY_IN_HOURS
                            ? parseInt(process.env.INVITE_TOKEN_EXPIRY_IN_HOURS)
                            : 24;
                        tokenExpiry.setHours(tokenExpiry.getHours() + expiryInHours);
                        data.user.tokenExpiry = tokenExpiry;
                    }
                    else {
                        data.user.status = user_entity_1.UserStatus.ACTIVE;
                    }
                    data.user = await this.userService.createNewUser(data.user, queryRunner);
                    if (data.user.status === user_entity_1.UserStatus.UNVERIFIED) {
                        const verificationLink = (0, url_util_1.getSecureTokenLink)('/verify', data.user.tempToken);
                        await (0, sendEmail_1.sendVerificationEmailForCloud)(data.user.email, verificationLink);
                    }
                }
                break;
            }
            default:
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Unhandled Edge Case" /* GeneralErrorMessage.UNHANDLED_EDGE_CASE */);
        }
        if (!data.organization.id) {
            data.organization.createdBy = data.user.createdBy;
            data.organization = this.organizationservice.createNewOrganization(data.organization, queryRunner, true);
        }
        data.organizationUser.organizationId = data.organization.id;
        data.organizationUser.userId = data.user.id;
        data.organizationUser.createdBy = data.user.createdBy;
        data.organizationUser = this.organizationUserService.createNewOrganizationUser(data.organizationUser, queryRunner);
        data.workspace.organizationId = data.organization.id;
        data.workspace.createdBy = data.user.createdBy;
        data.workspace = this.workspaceService.createNewWorkspace(data.workspace, queryRunner, true);
        data.workspaceUser.workspaceId = data.workspace.id;
        data.workspaceUser.userId = data.user.id;
        data.workspaceUser.createdBy = data.user.createdBy;
        data.workspaceUser.status = workspace_user_entity_1.WorkspaceUserStatus.ACTIVE;
        data.workspaceUser = this.workspaceUserService.createNewWorkspaceUser(data.workspaceUser, queryRunner);
        return data;
    }
    async saveRegisterAccount(data) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const platform = this.identityManager.getPlatformType();
        const ownerRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.OWNER, queryRunner);
        try {
            data = await this.createRegisterAccount(data, queryRunner);
            await queryRunner.startTransaction();
            data.user = await this.userService.saveUser(data.user, queryRunner);
            data.organization = await this.organizationservice.saveOrganization(data.organization, queryRunner);
            data.organizationUser = await this.organizationUserService.saveOrganizationUser(data.organizationUser, queryRunner);
            data.workspace = await this.workspaceService.saveWorkspace(data.workspace, queryRunner);
            data.workspaceUser = await this.workspaceUserService.saveWorkspaceUser(data.workspaceUser, queryRunner);
            if (data.workspace.id &&
                (platform === Interface_1.Platform.OPEN_SOURCE || platform === Interface_1.Platform.ENTERPRISE) &&
                ownerRole.id === data.organizationUser.roleId) {
                await this.workspaceService.setNullWorkspaceId(queryRunner, data.workspace.id);
            }
            await queryRunner.commitTransaction();
            delete data.user.credential;
            delete data.user.tempToken;
            delete data.user.tokenExpiry;
            return data;
        }
        catch (error) {
            if (queryRunner && queryRunner.isTransactionActive)
                await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            if (queryRunner && !queryRunner.isReleased)
                await queryRunner.release();
        }
    }
    async register(data) {
        return await this.saveRegisterAccount(data);
    }
    async saveInviteAccount(data, currentUser) {
        data = this.initializeAccountDTO(data);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            const workspace = await this.workspaceService.readWorkspaceById(data.workspace.id, queryRunner);
            if (!workspace)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Workspace Not Found" /* WorkspaceErrorMessage.WORKSPACE_NOT_FOUND */);
            data.workspace = workspace;
            const totalOrgUsers = await this.organizationUserService.readOrgUsersCountByOrgId(data.workspace.organizationId || '');
            const subscriptionId = currentUser?.activeOrganizationSubscriptionId || '';
            const role = await this.roleService.readRoleByRoleIdOrganizationId(data.role.id, data.workspace.organizationId, queryRunner);
            if (!role)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
            data.role = role;
            const user = await this.userService.readUserByEmail(data.user.email, queryRunner);
            if (!user) {
                await (0, quotaUsage_1.checkUsageLimit)('users', subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, totalOrgUsers + 1);
                // generate a temporary token
                data.user.tempToken = (0, tempTokenUtils_1.generateTempToken)();
                const tokenExpiry = new Date();
                // set expiry based on env setting and fallback to 24 hours
                const expiryInHours = process.env.INVITE_TOKEN_EXPIRY_IN_HOURS ? parseInt(process.env.INVITE_TOKEN_EXPIRY_IN_HOURS) : 24;
                tokenExpiry.setHours(tokenExpiry.getHours() + expiryInHours);
                data.user.tokenExpiry = tokenExpiry;
                data.user.status = user_entity_1.UserStatus.INVITED;
                // send invite
                const registerLink = this.identityManager.getPlatformType() === Interface_1.Platform.ENTERPRISE
                    ? (0, url_util_1.getSecureTokenLink)('/register', data.user.tempToken)
                    : (0, url_util_1.getSecureAppUrl)('/register');
                await this.sendInviteEmailIfAllowed(() => (0, sendEmail_1.sendWorkspaceInvite)(data.user.email, data.workspace.name, registerLink, this.identityManager.getPlatformType()), 'workspace-invite');
                data.user = await this.userService.createNewUser(data.user, queryRunner);
                data.organizationUser.organizationId = data.workspace.organizationId;
                data.organizationUser.userId = data.user.id;
                const roleMember = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.MEMBER, queryRunner);
                data.organizationUser.roleId = roleMember.id;
                data.organizationUser.createdBy = data.user.createdBy;
                data.organizationUser.status = organization_user_entity_1.OrganizationUserStatus.INVITED;
                data.organizationUser = await this.organizationUserService.createNewOrganizationUser(data.organizationUser, queryRunner);
                workspace.updatedBy = data.user.createdBy;
                data.workspaceUser.workspaceId = data.workspace.id;
                data.workspaceUser.userId = data.user.id;
                data.workspaceUser.roleId = data.role.id;
                data.workspaceUser.createdBy = data.user.createdBy;
                data.workspaceUser.status = workspace_user_entity_1.WorkspaceUserStatus.INVITED;
                data.workspaceUser = await this.workspaceUserService.createNewWorkspaceUser(data.workspaceUser, queryRunner);
                await queryRunner.startTransaction();
                data.user = await this.userService.saveUser(data.user, queryRunner);
                await this.workspaceService.saveWorkspace(workspace, queryRunner);
                data.organizationUser = await this.organizationUserService.saveOrganizationUser(data.organizationUser, queryRunner);
                data.workspaceUser = await this.workspaceUserService.saveWorkspaceUser(data.workspaceUser, queryRunner);
                data.role = await this.roleService.saveRole(data.role, queryRunner);
                await queryRunner.commitTransaction();
                data.user = (0, sanitize_util_1.sanitizeUser)(data.user);
                return data;
            }
            const { organizationUser } = await this.organizationUserService.readOrganizationUserByOrganizationIdUserId(data.workspace.organizationId, user.id, queryRunner);
            if (!organizationUser) {
                await (0, quotaUsage_1.checkUsageLimit)('users', subscriptionId, (0, getRunningExpressApp_1.getRunningExpressApp)().usageCacheManager, totalOrgUsers + 1);
                data.organizationUser.organizationId = data.workspace.organizationId;
                data.organizationUser.userId = user.id;
                const roleMember = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.MEMBER, queryRunner);
                data.organizationUser.roleId = roleMember.id;
                data.organizationUser.createdBy = data.user.createdBy;
                data.organizationUser.status = organization_user_entity_1.OrganizationUserStatus.INVITED;
                data.organizationUser = await this.organizationUserService.createNewOrganizationUser(data.organizationUser, queryRunner);
            }
            else {
                data.organizationUser = organizationUser;
            }
            let oldWorkspaceUser;
            if (data.organizationUser.status === organization_user_entity_1.OrganizationUserStatus.INVITED) {
                const workspaceUser = await this.workspaceUserService.readWorkspaceUserByOrganizationIdUserId(data.workspace.organizationId, user.id, queryRunner);
                let registerLink;
                if (this.identityManager.getPlatformType() === Interface_1.Platform.ENTERPRISE) {
                    data.user = user;
                    data.user.tempToken = (0, tempTokenUtils_1.generateTempToken)();
                    const tokenExpiry = new Date();
                    const expiryInHours = process.env.INVITE_TOKEN_EXPIRY_IN_HOURS ? parseInt(process.env.INVITE_TOKEN_EXPIRY_IN_HOURS) : 24;
                    tokenExpiry.setHours(tokenExpiry.getHours() + expiryInHours);
                    data.user.tokenExpiry = tokenExpiry;
                    await this.userService.saveUser(data.user, queryRunner);
                    registerLink = (0, url_util_1.getSecureTokenLink)('/register', data.user.tempToken);
                }
                else {
                    registerLink = (0, url_util_1.getSecureAppUrl)('/register');
                }
                if (workspaceUser.length === 1) {
                    oldWorkspaceUser = workspaceUser[0];
                    if (oldWorkspaceUser.workspace.name === workspace_entity_1.WorkspaceName.DEFAULT_PERSONAL_WORKSPACE) {
                        await this.sendInviteEmailIfAllowed(() => (0, sendEmail_1.sendWorkspaceInvite)(data.user.email, data.workspace.name, registerLink, this.identityManager.getPlatformType()), 'workspace-invite');
                    }
                    else {
                        await this.sendInviteEmailIfAllowed(() => (0, sendEmail_1.sendWorkspaceInvite)(data.user.email, data.workspace.name, registerLink, this.identityManager.getPlatformType(), 'update'), 'workspace-invite-update');
                    }
                }
                else {
                    await this.sendInviteEmailIfAllowed(() => (0, sendEmail_1.sendWorkspaceInvite)(data.user.email, data.workspace.name, registerLink, this.identityManager.getPlatformType()), 'workspace-invite');
                }
            }
            else {
                data.organizationUser.updatedBy = data.user.createdBy;
                const dashboardLink = (0, url_util_1.getSecureAppUrl)();
                await this.sendInviteEmailIfAllowed(() => (0, sendEmail_1.sendWorkspaceAdd)(data.user.email, data.workspace.name, dashboardLink), 'workspace-add');
            }
            workspace.updatedBy = data.user.createdBy;
            data.workspaceUser.workspaceId = data.workspace.id;
            data.workspaceUser.userId = user.id;
            data.workspaceUser.roleId = data.role.id;
            data.workspaceUser.createdBy = data.user.createdBy;
            data.workspaceUser.status = workspace_user_entity_1.WorkspaceUserStatus.INVITED;
            data.workspaceUser = await this.workspaceUserService.createNewWorkspaceUser(data.workspaceUser, queryRunner);
            const personalWorkspaceRole = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.PERSONAL_WORKSPACE, queryRunner);
            if (oldWorkspaceUser && oldWorkspaceUser.roleId !== personalWorkspaceRole.id) {
                await this.workspaceUserService.deleteWorkspaceUser(oldWorkspaceUser.workspaceId, user.id);
            }
            await queryRunner.startTransaction();
            data.organizationUser = await this.organizationUserService.saveOrganizationUser(data.organizationUser, queryRunner);
            await this.workspaceService.saveWorkspace(workspace, queryRunner);
            data.workspaceUser = await this.workspaceUserService.saveWorkspaceUser(data.workspaceUser, queryRunner);
            data.role = await this.roleService.saveRole(data.role, queryRunner);
            await queryRunner.commitTransaction();
            data.user = (0, sanitize_util_1.sanitizeUser)(data.user);
            return data;
        }
        catch (error) {
            if (queryRunner && queryRunner.isTransactionActive)
                await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            if (queryRunner && !queryRunner.isReleased)
                await queryRunner.release();
        }
    }
    async invite(data, user) {
        return await this.saveInviteAccount(data, user);
    }
    async login(data) {
        data = this.initializeAccountDTO(data);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const platform = this.identityManager.getPlatformType();
        try {
            if (!data.user.credential) {
                await audit_1.default.recordLoginActivity(data.user.email || '', Interface_Enterprise_1.LoginActivityCode.INCORRECT_CREDENTIAL, 'Login Failed');
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Credential" /* UserErrorMessage.INVALID_USER_CREDENTIAL */);
            }
            const user = await this.userService.readUserByEmail(data.user.email, queryRunner);
            if (!user) {
                await audit_1.default.recordLoginActivity(data.user.email || '', Interface_Enterprise_1.LoginActivityCode.UNKNOWN_USER, 'Login Failed');
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            }
            if (!user.credential) {
                await audit_1.default.recordLoginActivity(user.email || '', Interface_Enterprise_1.LoginActivityCode.INCORRECT_CREDENTIAL, 'Login Failed');
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Credential" /* UserErrorMessage.INVALID_USER_CREDENTIAL */);
            }
            if (!(0, encryption_util_1.compareHash)(data.user.credential, user.credential)) {
                await audit_1.default.recordLoginActivity(user.email || '', Interface_Enterprise_1.LoginActivityCode.INCORRECT_CREDENTIAL, 'Login Failed');
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Incorrect Email or Password" /* UserErrorMessage.INCORRECT_USER_EMAIL_OR_CREDENTIALS */);
            }
            // If the stored hash was created with fewer salt rounds than the current minimum
            // (e.g. 5 before we increased to 10), rehash with the current rounds on successful login.
            if ((0, encryption_util_1.hashNeedsUpgrade)(user.credential, (0, encryption_util_1.getPasswordSaltRounds)())) {
                try {
                    const newHash = (0, encryption_util_1.getHash)(data.user.credential);
                    await this.userService.saveUser({ ...user, credential: newHash }, queryRunner);
                }
                catch (upgradeError) {
                    logger_1.default.warn(`Failed to upgrade password hash for user ${user.email}`, upgradeError);
                }
            }
            if (user.status === user_entity_1.UserStatus.UNVERIFIED) {
                await audit_1.default.recordLoginActivity(data.user.email || '', Interface_Enterprise_1.LoginActivityCode.REGISTRATION_PENDING, 'Login Failed');
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User Email Unverified" /* UserErrorMessage.USER_EMAIL_UNVERIFIED */);
            }
            let wsUserOrUsers = await this.workspaceUserService.readWorkspaceUserByLastLogin(user.id, queryRunner);
            if (Array.isArray(wsUserOrUsers)) {
                if (wsUserOrUsers.length > 0) {
                    wsUserOrUsers = wsUserOrUsers[0];
                }
                else {
                    await audit_1.default.recordLoginActivity(user.email || '', Interface_Enterprise_1.LoginActivityCode.NO_ASSIGNED_WORKSPACE, 'Login Failed');
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Workspace User Not Found" /* WorkspaceUserErrorMessage.WORKSPACE_USER_NOT_FOUND */);
                }
            }
            if (platform === Interface_1.Platform.ENTERPRISE) {
                await audit_1.default.recordLoginActivity(user.email, Interface_Enterprise_1.LoginActivityCode.LOGIN_SUCCESS, 'Login Success', undefined, wsUserOrUsers?.workspace?.organizationId);
            }
            const sanitizedUser = (0, sanitize_util_1.sanitizeUser)(user);
            return { user: sanitizedUser, workspaceDetails: wsUserOrUsers };
        }
        finally {
            await queryRunner.release();
        }
    }
    async verify(data) {
        data = this.initializeAccountDTO(data);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            await queryRunner.startTransaction();
            if (!data.user.tempToken)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Temporary Token" /* UserErrorMessage.INVALID_TEMP_TOKEN */);
            this.assertNotEmailChangeJwt(data.user.tempToken);
            const user = await this.userService.readUserByToken(data.user.tempToken, queryRunner);
            if (!user)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            data.user = user;
            data.user.tempToken = null;
            data.user.tokenExpiry = null;
            data.user.status = user_entity_1.UserStatus.ACTIVE;
            data.user = await this.userService.saveUser(data.user, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        data.user = (0, sanitize_util_1.sanitizeUser)(data.user);
        return data;
    }
    async forgotPassword(data) {
        data = this.initializeAccountDTO(data);
        if (!this.canSendTransactionalEmail()) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email (SMTP) is not configured on this server" /* GeneralErrorMessage.SMTP_NOT_CONFIGURED */);
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            await queryRunner.startTransaction();
            const user = await this.userService.readUserByEmail(data.user.email, queryRunner);
            if (!user)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            data.user = user;
            data.user.tempToken = (0, tempTokenUtils_1.generateTempToken)();
            const tokenExpiry = new Date();
            const expiryInMins = process.env.PASSWORD_RESET_TOKEN_EXPIRY_IN_MINUTES
                ? parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_IN_MINUTES)
                : 15;
            tokenExpiry.setMinutes(tokenExpiry.getMinutes() + expiryInMins);
            data.user.tokenExpiry = tokenExpiry;
            data.user = await this.userService.saveUser(data.user, queryRunner);
            const resetLink = (0, url_util_1.getSecureTokenLink)('/reset-password', data.user.tempToken);
            await (0, sendEmail_1.sendPasswordResetEmail)(data.user.email, resetLink);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return { message: 'success' };
    }
    async resetPassword(data) {
        data = this.initializeAccountDTO(data);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            if (!data.user.tempToken)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Temporary Token" /* UserErrorMessage.INVALID_TEMP_TOKEN */);
            this.assertNotEmailChangeJwt(data.user.tempToken);
            const user = await this.userService.readUserByEmail(data.user.email, queryRunner);
            if (!user)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            if (!user.tempToken || user.tempToken !== data.user.tempToken)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Temporary Token" /* UserErrorMessage.INVALID_TEMP_TOKEN */);
            const tokenExpiry = user.tokenExpiry;
            if (!tokenExpiry)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Temporary Token" /* UserErrorMessage.INVALID_TEMP_TOKEN */);
            const tokenExpiryMoment = (0, moment_1.default)(tokenExpiry);
            if (!tokenExpiryMoment.isValid() || (0, moment_1.default)().isAfter(tokenExpiryMoment))
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Expired Temporary Token" /* UserErrorMessage.EXPIRED_TEMP_TOKEN */);
            // @ts-ignore
            const password = data.user.password;
            (0, validation_util_1.validatePasswordOrThrow)(password);
            // all checks are done, now update the user password, don't forget to hash it and do not forget to clear the temp token
            // leave the user status and other details as is
            const salt = bcryptjs_1.default.genSaltSync((0, encryption_util_1.getPasswordSaltRounds)());
            // @ts-ignore
            const hash = bcryptjs_1.default.hashSync(password, salt);
            data.user = user;
            data.user.credential = hash;
            data.user.tempToken = null;
            data.user.tokenExpiry = null;
            data.user.status = user_entity_1.UserStatus.ACTIVE;
            await queryRunner.startTransaction();
            data.user = await this.userService.saveUser(data.user, queryRunner);
            await queryRunner.commitTransaction();
            // Invalidate all sessions for this user after password reset
            await (0, SessionPersistance_1.destroyAllSessionsForUser)(user.id);
        }
        catch (error) {
            if (queryRunner && queryRunner.isTransactionActive)
                await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            if (queryRunner && !queryRunner.isReleased)
                await queryRunner.release();
        }
        return { message: 'success' };
    }
    async logout(user) {
        const platform = this.identityManager.getPlatformType();
        if (platform === Interface_1.Platform.ENTERPRISE) {
            await audit_1.default.recordLoginActivity(user.email, Interface_Enterprise_1.LoginActivityCode.LOGOUT_SUCCESS, 'Logout Success', user.ssoToken ? 'SSO' : 'Email/Password', user.activeOrganizationId);
        }
    }
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
    async delete(queryRunner, loggedInUser, ipAddress) {
        if (this.identityManager.getPlatformType() !== Interface_1.Platform.CLOUD)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden" /* GeneralErrorMessage.FORBIDDEN */);
        if (!loggedInUser.id)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Unauthorized" /* GeneralErrorMessage.UNAUTHORIZED */);
        // Step 3.1: Find User ID by Email
        const user = await this.userService.readUserById(loggedInUser.id, queryRunner);
        if (!user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        // Step 3.1: Find Organization Memberships and Roles
        const targetUserOrganizationMemberships = await this.organizationUserService.readOrganizationUserByUserId(user.id, queryRunner);
        if (!targetUserOrganizationMemberships?.length)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization User Not Found" /* OrganizationUserErrorMessage.ORGANIZATION_USER_NOT_FOUND */);
        // Step 3.1.1: Verify that there is only one owner
        const organizationIdsWhereOwner = targetUserOrganizationMemberships
            .filter((organizationUser) => organizationUser.isOrgOwner)
            .map((organizationUser) => organizationUser);
        if (organizationIdsWhereOwner.length !== 1)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Not Allowed To Delete Owner" /* GeneralErrorMessage.NOT_ALLOWED_TO_DELETE_OWNER */);
        const organizaiton = await this.organizationservice.readOrganizationById(organizationIdsWhereOwner[0].organizationId, queryRunner);
        if (!organizaiton?.subscriptionId)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Organization has no subscription" /* OrganizationErrorMessage.ORGANIZATION_HAS_NO_SUBSCRIPTION */);
        // Step 3.1.2: Verify how many people invited him as member
        const organizationsUserWasInvitedTo = targetUserOrganizationMemberships
            .filter((organizationUser) => !organizationUser.isOrgOwner)
            .map((organizationUser) => organizationUser.organizationId);
        // Step 3.3: Find All Members and Owner in the Organization
        const organizationUsers = await this.organizationUserService.readOrganizationUserByOrganizationId(organizaiton.id, queryRunner);
        if (!organizationUsers)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization User Not Found" /* OrganizationUserErrorMessage.ORGANIZATION_USER_NOT_FOUND */);
        const membershipsWhereUserWasInvited = organizationUsers
            .filter((organizationUser) => !organizationUser.isOrgOwner)
            .map((organizationUser) => organizationUser.userId);
        // Step 3.4: Find All Workspaces for the Organization
        const workspaceIds = (await queryRunner.manager.findBy(workspace_entity_1.Workspace, { organizationId: organizaiton.id })).map((workspace) => workspace.id);
        if (workspaceIds.length === 0)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Workspace Not Found" /* WorkspaceErrorMessage.WORKSPACE_NOT_FOUND */);
        const chatflowIds = (await queryRunner.manager.findBy(ChatFlow_1.ChatFlow, { workspaceId: (0, typeorm_1.In)(workspaceIds) })).map((chatflow) => chatflow.id);
        const documentStoreIds = (await queryRunner.manager.findBy(DocumentStore_1.DocumentStore, { workspaceId: (0, typeorm_1.In)(workspaceIds) })).map((documentStore) => documentStore.id);
        const evaluationIds = (await queryRunner.manager.findBy(Evaluation_1.Evaluation, { workspaceId: (0, typeorm_1.In)(workspaceIds) })).map((evaluation) => evaluation.id);
        const datasetIds = (await queryRunner.manager.findBy(Dataset_1.Dataset, { workspaceId: (0, typeorm_1.In)(workspaceIds) })).map((dataset) => dataset.id);
        // Step 4: Deletion Process
        await queryRunner.startTransaction();
        // Step 4.1: Delete Organization Users with Member Role
        await queryRunner.manager.delete(organization_user_entity_1.OrganizationUser, { userId: loggedInUser.id, organizationId: (0, typeorm_1.In)(organizationsUserWasInvitedTo) });
        await queryRunner.manager.delete(organization_user_entity_1.OrganizationUser, {
            organizationId: organizaiton.id,
            userId: (0, typeorm_1.In)(membershipsWhereUserWasInvited)
        });
        // Step 4.2: Delete Workspace Users
        await queryRunner.manager.delete(workspace_user_entity_1.WorkspaceUser, { workspaceId: (0, typeorm_1.In)(workspaceIds) });
        await queryRunner.manager.delete(workspace_user_entity_1.WorkspaceUser, { userId: loggedInUser.id });
        // Step 4.3: Delete Roles created for the Organization
        await queryRunner.manager.delete(role_entity_1.Role, { organizationId: organizaiton.id });
        // Step 4.4: Delete Workspace Child Data
        // Step 4.4.1: Delete Chat Messages
        await queryRunner.manager.delete(ChatMessageFeedback_1.ChatMessageFeedback, { chatflowid: (0, typeorm_1.In)(chatflowIds) });
        await queryRunner.manager.delete(ChatMessage_1.ChatMessage, { chatflowid: (0, typeorm_1.In)(chatflowIds) });
        // Step 4.4.2: Delete Upsert History
        await queryRunner.manager.delete(UpsertHistory_1.UpsertHistory, { chatflowid: (0, typeorm_1.In)(chatflowIds) });
        await queryRunner.manager.delete(UpsertHistory_1.UpsertHistory, { chatflowid: (0, typeorm_1.In)(documentStoreIds) }); // don't be alarm because we reuse the chatflowid for document store upsert history
        // Step 4.4.3: Delete Leads
        await queryRunner.manager.delete(Lead_1.Lead, { chatflowid: (0, typeorm_1.In)(chatflowIds) });
        // Step 4.4.4: Delete Document Store Data
        await queryRunner.manager.delete(DocumentStoreFileChunk_1.DocumentStoreFileChunk, { storeId: (0, typeorm_1.In)(documentStoreIds) });
        await queryRunner.manager.delete(DocumentStore_1.DocumentStore, { workspaceId: (0, typeorm_1.In)(workspaceIds) });
        // Step 4.4.5: Delete Evaluation Data
        await queryRunner.manager.delete(EvaluationRun_1.EvaluationRun, { evaluationId: (0, typeorm_1.In)(evaluationIds) });
        await queryRunner.manager.delete(Evaluation_1.Evaluation, { workspaceId: (0, typeorm_1.In)(workspaceIds) });
        // Step 4.4.6: Delete Dataset Data
        await queryRunner.manager.delete(DatasetRow_1.DatasetRow, { datasetId: (0, typeorm_1.In)(datasetIds) });
        await queryRunner.manager.delete(Dataset_1.Dataset, { workspaceId: (0, typeorm_1.In)(workspaceIds) });
        // Step 4.4.7: Delete ChatFlows
        await queryRunner.manager.delete(ChatFlow_1.ChatFlow, { workspaceId: (0, typeorm_1.In)(workspaceIds) });
        // Step 4.4.8: Delete Other Workspace Resources
        await queryRunner.manager.delete(ApiKey_1.ApiKey, { workspaceId: (0, typeorm_1.In)(workspaceIds) });
        await queryRunner.manager.delete(Variable_1.Variable, { workspaceId: (0, typeorm_1.In)(workspaceIds) });
        await queryRunner.manager.delete(Tool_1.Tool, { workspaceId: (0, typeorm_1.In)(workspaceIds) });
        await queryRunner.manager.delete(Credential_1.Credential, { workspaceId: (0, typeorm_1.In)(workspaceIds) });
        await queryRunner.manager.delete(Assistant_1.Assistant, { workspaceId: (0, typeorm_1.In)(workspaceIds) });
        await queryRunner.manager.delete(Evaluator_1.Evaluator, { workspaceId: (0, typeorm_1.In)(workspaceIds) });
        await queryRunner.manager.delete(CustomTemplate_1.CustomTemplate, { workspaceId: (0, typeorm_1.In)(workspaceIds) });
        await queryRunner.manager.delete(Execution_1.Execution, { workspaceId: (0, typeorm_1.In)(workspaceIds) });
        // Step 4.4.9: Delete Workspace
        await queryRunner.manager.delete(EnterpriseEntities_1.WorkspaceShared, { workspaceId: (0, typeorm_1.In)(workspaceIds) });
        await queryRunner.manager.delete(workspace_entity_1.Workspace, { id: (0, typeorm_1.In)(workspaceIds) });
        // Step 5: Anonymize User Record (GDPR Compliance)
        user.name = user_entity_1.UserStatus.DELETED;
        user.email = `deleted_${user.id}_${Date.now()}@deleted.flowise`;
        user.status = user_entity_1.UserStatus.DELETED;
        user.credential = null;
        user.tokenExpiry = null;
        user.tempToken = null;
        await queryRunner.manager.save(user_entity_1.User, user);
        // Step 6: Cancel Stripe Subscription
        await this.identityManager.cancelSubscription(organizaiton.subscriptionId);
        await queryRunner.commitTransaction();
        // Step 7: Delete Organization Folder from Storage
        await (0, accelance_components_1.removeFolderFromStorage)(organizaiton.id);
        await (0, telemetry_1.emitEvent)({
            category: telemetry_1.TelemetryEventCategory.AUDIT,
            eventType: 'account-deleted',
            actionType: 'delete',
            userId: user.id,
            orgId: organizaiton.id,
            resourceId: user.id,
            ipAddress: ipAddress,
            result: telemetry_1.TelemetryEventResult.SUCCESS
        });
    }
    async initiateEmailChange(userId, newEmail) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            await queryRunner.startTransaction();
            const user = await this.userService.readUserById(userId, queryRunner);
            if (!user?.email)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            const expiryInHours = process.env.INVITE_TOKEN_EXPIRY_IN_HOURS ? parseInt(process.env.INVITE_TOKEN_EXPIRY_IN_HOURS) : 24;
            const { token, tokenExpiry } = (0, emailChangeJwt_util_1.signEmailChangeJwt)(userId, newEmail, expiryInHours);
            const merged = queryRunner.manager.merge(user_entity_1.User, user, {
                tempToken: token,
                tokenExpiry
            });
            await this.userService.saveUser(merged, queryRunner);
            const confirmLink = (0, url_util_1.getSecureTokenLink)('/confirm-email-change', token);
            await (0, sendEmail_1.sendEmailChangeConfirmationEmail)(user.email, confirmLink, newEmail);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            if (queryRunner.isTransactionActive)
                await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async confirmEmailChange(data) {
        const token = data.user?.tempToken;
        if (!token)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Temporary Token" /* UserErrorMessage.INVALID_TEMP_TOKEN */);
        let userId;
        let newEmail;
        try {
            ;
            ({ userId, newEmail } = (0, emailChangeJwt_util_1.verifyEmailChangeJwt)(token));
        }
        catch (e) {
            if (e instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Expired Temporary Token" /* UserErrorMessage.EXPIRED_TEMP_TOKEN */);
            }
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Temporary Token" /* UserErrorMessage.INVALID_TEMP_TOKEN */);
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            const user = await this.userService.readUserById(userId, queryRunner);
            if (!user || user.tempToken !== token)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            const taken = await this.userService.readUserByEmail(newEmail, queryRunner);
            if (taken && taken.id !== user.id) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "User Email Already Exists" /* UserErrorMessage.USER_EMAIL_ALREADY_EXISTS */);
            }
            await this.userService.updateUser({
                id: user.id,
                updatedBy: user.id,
                email: newEmail,
                tempToken: null,
                tokenExpiry: null
            }, {
                onEmailChanged: (uid, em) => this.syncStripeCustomerEmailAfterUserEmailChange(uid, em)
            });
            return { message: 'success' };
        }
        finally {
            await queryRunner.release();
        }
    }
    async updateAuthenticatedUserProfile(currentUserId, body, onEmailChanged) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            const dbUser = await this.userService.readUserById(currentUserId, queryRunner);
            if (!dbUser)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            const platform = this.identityManager.getPlatformType();
            const newEmailRaw = body.email?.trim();
            const emailChanging = newEmailRaw !== undefined && newEmailRaw.toLowerCase() !== (dbUser.email || '').toLowerCase();
            const useEmailChangeConfirmation = emailChanging && (platform === Interface_1.Platform.CLOUD || (0, sendEmail_1.isSmtpConfigured)());
            const passwordChanging = !!(body.oldPassword && body.newPassword && body.confirmPassword);
            const nameChanging = body.name !== undefined && body.name !== dbUser.name;
            if (emailChanging && useEmailChangeConfirmation) {
                this.userService.validateUserEmail(newEmailRaw);
                const taken = await this.userService.readUserByEmail(newEmailRaw, queryRunner);
                if (taken && taken.id !== dbUser.id) {
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "User Email Already Exists" /* UserErrorMessage.USER_EMAIL_ALREADY_EXISTS */);
                }
                if (passwordChanging || nameChanging) {
                    await this.userService.updateUser({
                        id: currentUserId,
                        updatedBy: currentUserId,
                        name: body.name !== undefined ? body.name : dbUser.name,
                        email: dbUser.email,
                        oldPassword: body.oldPassword,
                        newPassword: body.newPassword,
                        confirmPassword: body.confirmPassword
                    }, {});
                }
                await this.initiateEmailChange(currentUserId, newEmailRaw);
                const readRunner = this.dataSource.createQueryRunner();
                await readRunner.connect();
                try {
                    const refreshed = await this.userService.readUserById(currentUserId, readRunner);
                    return {
                        user: (0, sanitize_util_1.sanitizeUser)({ ...refreshed }),
                        emailChangePending: true,
                        pendingEmail: newEmailRaw
                    };
                }
                finally {
                    await readRunner.release();
                }
            }
            if (emailChanging && !useEmailChangeConfirmation) {
                this.userService.validateUserEmail(newEmailRaw);
                const taken = await this.userService.readUserByEmail(newEmailRaw, queryRunner);
                if (taken && taken.id !== dbUser.id) {
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "User Email Already Exists" /* UserErrorMessage.USER_EMAIL_ALREADY_EXISTS */);
                }
                const user = await this.userService.updateUser({
                    id: currentUserId,
                    updatedBy: currentUserId,
                    ...(body.name !== undefined ? { name: body.name } : {}),
                    email: body.email,
                    oldPassword: body.oldPassword,
                    newPassword: body.newPassword,
                    confirmPassword: body.confirmPassword,
                    tempToken: null,
                    tokenExpiry: null
                }, { onEmailChanged });
                return { user };
            }
            const user = await this.userService.updateUser({
                id: currentUserId,
                updatedBy: currentUserId,
                ...(body.name !== undefined ? { name: body.name } : {}),
                ...(body.email !== undefined ? { email: body.email } : {}),
                oldPassword: body.oldPassword,
                newPassword: body.newPassword,
                confirmPassword: body.confirmPassword
            }, {});
            return { user };
        }
        finally {
            await queryRunner.release();
        }
    }
    /**
     * Sync Stripe customer email when user changes their email (CLOUD only).
     * Expects exactly one org where the user is org owner; updates that org's Stripe customer email.
     */
    async syncStripeCustomerEmailAfterUserEmailChange(userId, newEmail) {
        if (this.identityManager.getPlatformType() !== Interface_1.Platform.CLOUD)
            return;
        let queryRunner;
        try {
            queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            const orgUsers = await this.organizationUserService.readOrganizationUserByUserId(userId, queryRunner);
            const ownerOrgLinks = orgUsers.filter((ou) => ou.isOrgOwner);
            if (ownerOrgLinks.length === 1) {
                const org = await this.organizationservice.readOrganizationById(ownerOrgLinks[0].organizationId, queryRunner);
                if (org?.customerId) {
                    await this.identityManager.updateStripeCustomerEmail(org.customerId, newEmail);
                }
            }
        }
        catch (error) {
            logger_1.default.warn(`Failed to update Stripe customer email for user ${userId}:`, error);
        }
        finally {
            if (queryRunner && !queryRunner.isReleased)
                await queryRunner.release();
        }
    }
}
exports.AccountService = AccountService;
//# sourceMappingURL=account.service.js.map