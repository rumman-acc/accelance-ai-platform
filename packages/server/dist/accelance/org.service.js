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
exports.inviteMember = inviteMember;
exports.getMembers = getMembers;
const jwt = __importStar(require("jsonwebtoken"));
const DataSource_1 = require("../DataSource");
const email_service_1 = require("./email.service");
const invite_entity_1 = require("../enterprise/database/entities/invite.entity");
const organization_entity_1 = require("../enterprise/database/entities/organization.entity");
const organization_user_entity_1 = require("../enterprise/database/entities/organization-user.entity");
const user_entity_1 = require("../enterprise/database/entities/user.entity");
const middleware_1 = require("./middleware");
async function inviteMember(caller, email) {
    const ds = (0, DataSource_1.getDataSource)();
    const orgUserRepo = ds.getRepository(organization_user_entity_1.OrganizationUser);
    const isAdmin = await orgUserRepo.findOne({
        where: { userId: caller.sub, organizationId: caller.tenantId, isAdmin: true }
    });
    if (!isAdmin)
        throw { status: 403, message: 'Only org admins can invite members' };
    const userRepo = ds.getRepository(user_entity_1.User);
    const existing = await userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
        const alreadyMember = await orgUserRepo.findOne({
            where: { userId: existing.id, organizationId: caller.tenantId }
        });
        if (alreadyMember)
            throw { status: 400, message: 'User is already a member of this org' };
    }
    const inviteRepo = ds.getRepository(invite_entity_1.Invite);
    await inviteRepo.delete({ email: email.toLowerCase(), organizationId: caller.tenantId });
    const org = await ds.getRepository(organization_entity_1.Organization).findOne({ where: { id: caller.tenantId } });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const token = jwt.sign({ email: email.toLowerCase(), organizationId: caller.tenantId, workspaceId: caller.workspaceId, type: 'invite' }, (0, middleware_1.getJwtSecret)(), { expiresIn: '24h' });
    await inviteRepo.save(inviteRepo.create({
        email: email.toLowerCase(),
        organizationId: caller.tenantId,
        workspaceId: caller.workspaceId,
        token,
        expiresAt,
        createdBy: caller.sub
    }));
    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    const inviteUrl = `${appUrl}/register?invite=${token}`;
    await (0, email_service_1.sendInviteEmail)({ to: email, inviteUrl, inviterName: caller.email, orgName: org?.name ?? 'your organization' });
    return { inviteUrl };
}
async function getMembers(caller) {
    const ds = (0, DataSource_1.getDataSource)();
    const orgUserRepo = ds.getRepository(organization_user_entity_1.OrganizationUser);
    const orgUsers = await orgUserRepo.find({ where: { organizationId: caller.tenantId } });
    const userIds = orgUsers.map((ou) => ou.userId);
    if (!userIds.length)
        return [];
    const users = await ds
        .getRepository(user_entity_1.User)
        .createQueryBuilder('u')
        .select(['u.id', 'u.name', 'u.email', 'u.status', 'u.createdDate'])
        .whereInIds(userIds)
        .getMany();
    return users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        status: u.status,
        isAdmin: orgUsers.find((ou) => ou.userId === u.id)?.isAdmin ?? false,
        joinedAt: u.createdDate
    }));
}
//# sourceMappingURL=org.service.js.map