"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.generateCanvasToken = generateCanvasToken;
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const DataSource_1 = require("../DataSource");
const invite_entity_1 = require("../enterprise/database/entities/invite.entity");
const organization_entity_1 = require("../enterprise/database/entities/organization.entity");
const organization_user_entity_1 = require("../enterprise/database/entities/organization-user.entity");
const role_entity_1 = require("../enterprise/database/entities/role.entity");
const user_entity_1 = require("../enterprise/database/entities/user.entity");
const workspace_user_entity_1 = require("../enterprise/database/entities/workspace-user.entity");
const workspace_entity_1 = require("../enterprise/database/entities/workspace.entity");
const middleware_1 = require("./middleware");
function signToken(user, tenantId, workspaceId, role) {
    const payload = { sub: user.id, email: user.email, tenantId, workspaceId, role };
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(payload, (0, middleware_1.getJwtSecret)(), { expiresIn });
    return {
        token,
        expiresIn,
        user: { id: user.id, name: user.name, email: user.email, tenantId, workspaceId, role }
    };
}
async function register(dto) {
    if (dto.inviteToken)
        return registerViaInvite(dto);
    const ds = (0, DataSource_1.getDataSource)();
    const userRepo = ds.getRepository(user_entity_1.User);
    const existing = await userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing)
        throw { status: 409, message: 'Email already in use' };
    const qr = ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
        const hashed = await bcrypt.hash(dto.password, 10);
        const user = await qr.manager.save(user_entity_1.User, qr.manager.create(user_entity_1.User, {
            name: dto.name,
            email: dto.email.toLowerCase(),
            credential: hashed,
            status: user_entity_1.UserStatus.ACTIVE,
            createdBy: 'system',
            updatedBy: 'system'
        }));
        const org = await qr.manager.save(organization_entity_1.Organization, qr.manager.create(organization_entity_1.Organization, {
            name: `${dto.name}'s Organization`,
            createdBy: user.id,
            updatedBy: user.id
        }));
        const ownerRole = await qr.manager.save(role_entity_1.Role, qr.manager.create(role_entity_1.Role, {
            name: 'Owner',
            description: 'Workspace owner — full access',
            permissions: '*',
            organizationId: org.id,
            createdBy: user.id,
            updatedBy: user.id
        }));
        const workspace = await qr.manager.save(workspace_entity_1.Workspace, qr.manager.create(workspace_entity_1.Workspace, {
            name: 'Personal Workspace',
            organizationId: org.id,
            createdBy: user.id,
            updatedBy: user.id
        }));
        await qr.manager.save(organization_user_entity_1.OrganizationUser, {
            organizationId: org.id,
            userId: user.id,
            isAdmin: true,
            createdBy: user.id,
            updatedBy: user.id
        });
        await qr.manager.save(workspace_user_entity_1.WorkspaceUser, {
            workspaceId: workspace.id,
            userId: user.id,
            roleId: ownerRole.id,
            status: workspace_user_entity_1.WorkspaceUserStatus.ACTIVE,
            createdBy: user.id,
            updatedBy: user.id
        });
        await qr.commitTransaction();
        return signToken(user, org.id, workspace.id, 'OWNER');
    }
    catch (err) {
        await qr.rollbackTransaction();
        throw err;
    }
    finally {
        await qr.release();
    }
}
async function registerViaInvite(dto) {
    let invitePayload;
    try {
        invitePayload = jwt.verify(dto.inviteToken, (0, middleware_1.getJwtSecret)());
    }
    catch {
        throw { status: 400, message: 'Invite link is invalid or has expired' };
    }
    if (invitePayload.type !== 'invite')
        throw { status: 400, message: 'Invalid invite token' };
    const ds = (0, DataSource_1.getDataSource)();
    const inviteRepo = ds.getRepository(invite_entity_1.Invite);
    const invite = await inviteRepo.findOne({ where: { token: dto.inviteToken } });
    if (!invite || invite.usedAt)
        throw { status: 400, message: 'Invite has already been used or does not exist' };
    if (new Date() > invite.expiresAt)
        throw { status: 400, message: 'Invite link has expired' };
    if (dto.email.toLowerCase() !== invitePayload.email.toLowerCase())
        throw { status: 400, message: 'Email does not match the invite' };
    const userRepo = ds.getRepository(user_entity_1.User);
    const existing = await userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing)
        throw { status: 409, message: 'An account with this email already exists' };
    const memberRole = await ds.getRepository(role_entity_1.Role).findOne({
        where: { organizationId: invitePayload.organizationId, name: 'Member' }
    });
    const qr = ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
        const hashed = await bcrypt.hash(dto.password, 10);
        const user = await qr.manager.save(user_entity_1.User, qr.manager.create(user_entity_1.User, {
            name: dto.name,
            email: dto.email.toLowerCase(),
            credential: hashed,
            status: user_entity_1.UserStatus.ACTIVE,
            createdBy: 'invite',
            updatedBy: 'invite'
        }));
        await qr.manager.save(organization_user_entity_1.OrganizationUser, {
            organizationId: invitePayload.organizationId,
            userId: user.id,
            isAdmin: false,
            createdBy: user.id,
            updatedBy: user.id
        });
        await qr.manager.save(workspace_user_entity_1.WorkspaceUser, {
            workspaceId: invitePayload.workspaceId,
            userId: user.id,
            roleId: memberRole?.id ?? undefined,
            status: workspace_user_entity_1.WorkspaceUserStatus.ACTIVE,
            createdBy: user.id,
            updatedBy: user.id
        });
        invite.usedAt = new Date();
        await qr.manager.save(invite_entity_1.Invite, invite);
        await qr.commitTransaction();
        return signToken(user, invitePayload.organizationId, invitePayload.workspaceId, 'Member');
    }
    catch (err) {
        await qr.rollbackTransaction();
        throw err;
    }
    finally {
        await qr.release();
    }
}
async function login(dto) {
    const ds = (0, DataSource_1.getDataSource)();
    const user = await ds.getRepository(user_entity_1.User).findOne({
        where: { email: dto.email.toLowerCase() },
        select: ['id', 'name', 'email', 'credential', 'status']
    });
    if (!user || !user.credential)
        throw { status: 401, message: 'Invalid email or password' };
    const match = await bcrypt.compare(dto.password, user.credential);
    if (!match)
        throw { status: 401, message: 'Invalid email or password' };
    const orgUser = await ds.getRepository(organization_user_entity_1.OrganizationUser).findOne({ where: { userId: user.id } });
    if (!orgUser)
        throw { status: 401, message: 'No organization found for user' };
    const workspaceUser = await ds.getRepository(workspace_user_entity_1.WorkspaceUser).findOne({
        where: { userId: user.id, status: workspace_user_entity_1.WorkspaceUserStatus.ACTIVE }
    });
    if (!workspaceUser)
        throw { status: 401, message: 'No active workspace found for user' };
    const role = await ds.getRepository(role_entity_1.Role).findOne({ where: { id: workspaceUser.roleId } });
    return signToken(user, orgUser.organizationId, workspaceUser.workspaceId, role?.name ?? 'MEMBER');
}
function generateCanvasToken(user) {
    const payload = {
        workspaceId: user.workspaceId,
        tenantId: user.tenantId,
        userId: user.sub,
        role: user.role,
        type: 'canvas'
    };
    const token = jwt.sign(payload, (0, middleware_1.getJwtSecret)(), { expiresIn: '2m' });
    return { token };
}
//# sourceMappingURL=auth.service.js.map