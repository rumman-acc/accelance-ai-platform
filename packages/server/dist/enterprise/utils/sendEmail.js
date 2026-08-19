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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailChangeConfirmationEmail = exports.sendVerificationEmailForCloud = exports.sendPasswordResetEmail = exports.sendWorkspaceInvite = exports.sendWorkspaceAdd = exports.isSmtpConfigured = void 0;
const handlebars = __importStar(require("handlebars"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const node_fs_1 = __importDefault(require("node:fs"));
const path_1 = __importDefault(require("path"));
const Interface_1 = require("../../Interface");
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const isSmtpConfigured = () => {
    const port = parseInt(process.env.SMTP_PORT, 10);
    return Boolean(process.env.SMTP_HOST?.trim() &&
        process.env.SMTP_USER?.trim() &&
        process.env.SMTP_PASSWORD?.trim() &&
        process.env.SMTP_PORT &&
        !Number.isNaN(port));
};
exports.isSmtpConfigured = isSmtpConfigured;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const FROM_ADDRESS = SENDER_EMAIL ? `"Accelance Team" <${SENDER_EMAIL}>` : '"Accelance Team" <noreply@accelance.io>';
const SMTP_SECURE = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true;
const TLS = process.env.ALLOW_UNAUTHORIZED_CERTS ? { rejectUnauthorized: false } : undefined;
const transporter = nodemailer_1.default.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE ?? true,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD
    },
    tls: TLS
});
console.log('[email] SMTP config:', {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    user: SMTP_USER,
    hasPassword: !!SMTP_PASSWORD
});
const getEmailTemplate = (defaultTemplateName, userTemplatePath) => {
    try {
        if (userTemplatePath) {
            return node_fs_1.default.readFileSync(userTemplatePath, 'utf8');
        }
    }
    catch (error) {
        console.warn(`Failed to load custom template from ${userTemplatePath}, falling back to default`);
    }
    return node_fs_1.default.readFileSync(path_1.default.join(__dirname, '../', 'emails', defaultTemplateName), 'utf8');
};
const sendWorkspaceAdd = async (email, workspaceName, dashboardLink) => {
    let htmlToSend;
    let textContent;
    const template = getEmailTemplate('workspace_add_cloud.hbs', process.env.WORKSPACE_INVITE_TEMPLATE_PATH);
    const compiledWorkspaceInviteTemplateSource = handlebars.compile(template);
    htmlToSend = compiledWorkspaceInviteTemplateSource({ workspaceName, dashboardLink });
    textContent = `You have been added to ${workspaceName}. Click here to visit your dashboard: ${dashboardLink}`; // plain text body
    console.log(`[email] Sending workspace-add to [${email}] workspace="${workspaceName}"`);
    try {
        const info = await transporter.sendMail({
            from: FROM_ADDRESS,
            to: email,
            subject: `You have been added to ${workspaceName}`,
            text: textContent,
            html: htmlToSend
        });
        console.log(`[email] Workspace-add sent OK to [${email}] messageId=${info.messageId} response=${info.response}`);
    }
    catch (err) {
        console.error(`[email] Failed to send workspace-add to [${email}]:`, err?.message ?? err);
        throw err;
    }
};
exports.sendWorkspaceAdd = sendWorkspaceAdd;
const sendWorkspaceInvite = async (email, workspaceName, registerLink, platform = Interface_1.Platform.ENTERPRISE, inviteType = 'new') => {
    let htmlToSend;
    let textContent;
    const template = platform === Interface_1.Platform.ENTERPRISE
        ? getEmailTemplate(inviteType === 'new' ? 'workspace_new_invite_enterprise.hbs' : 'workspace_update_invite_enterprise.hbs', process.env.WORKSPACE_INVITE_TEMPLATE_PATH)
        : getEmailTemplate(inviteType === 'new' ? 'workspace_new_invite_cloud.hbs' : 'workspace_update_invite_cloud.hbs', process.env.WORKSPACE_INVITE_TEMPLATE_PATH);
    const compiledWorkspaceInviteTemplateSource = handlebars.compile(template);
    htmlToSend = compiledWorkspaceInviteTemplateSource({ workspaceName, registerLink });
    textContent = `You have been invited to ${workspaceName}. Click here to register: ${registerLink}`; // plain text body
    console.log(`[email] Sending workspace invite to [${email}] workspace="${workspaceName}" link="${registerLink}"`);
    try {
        const info = await transporter.sendMail({
            from: FROM_ADDRESS,
            to: email,
            subject: `You have been invited to ${workspaceName}`,
            text: textContent,
            html: htmlToSend
        });
        console.log(`[email] Invite sent OK to [${email}] messageId=${info.messageId} response=${info.response}`);
    }
    catch (err) {
        console.error(`[email] Failed to send invite to [${email}]:`, err?.message ?? err);
        throw err;
    }
};
exports.sendWorkspaceInvite = sendWorkspaceInvite;
const sendPasswordResetEmail = async (email, resetLink) => {
    const passwordResetTemplateSource = node_fs_1.default.readFileSync(path_1.default.join(__dirname, '../', 'emails', 'workspace_user_reset_password.hbs'), 'utf8');
    const compiledPasswordResetTemplateSource = handlebars.compile(passwordResetTemplateSource);
    const htmlToSend = compiledPasswordResetTemplateSource({ resetLink });
    await transporter.sendMail({
        from: FROM_ADDRESS, // sender address
        to: email,
        subject: 'Reset your password', // Subject line
        text: `You requested a link to reset your password. Click here to reset the password: ${resetLink}`, // plain text body
        html: htmlToSend // html body
    });
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendEmailChangeConfirmationEmail = async (email, confirmLink, newEmail) => {
    const template = getEmailTemplate('confirm_email_change.hbs');
    const compiled = handlebars.compile(template);
    const htmlToSend = compiled({ confirmLink, newEmail });
    const textContent = `Confirm your email change to ${newEmail}: ${confirmLink}`;
    await transporter.sendMail({
        from: FROM_ADDRESS,
        to: email,
        subject: 'Confirm your email address change',
        text: textContent,
        html: htmlToSend
    });
};
exports.sendEmailChangeConfirmationEmail = sendEmailChangeConfirmationEmail;
const sendVerificationEmailForCloud = async (email, verificationLink) => {
    let htmlToSend;
    let textContent;
    const template = getEmailTemplate('verify_email_cloud.hbs');
    const compiledWorkspaceInviteTemplateSource = handlebars.compile(template);
    htmlToSend = compiledWorkspaceInviteTemplateSource({ verificationLink });
    textContent = `To complete your registration, we need to verify your email address. Click here to verify your email address: ${verificationLink}`; // plain text body
    await transporter.sendMail({
        from: FROM_ADDRESS, // sender address
        to: email,
        subject: 'Action Required: Please verify your email', // Subject line
        text: textContent, // plain text body
        html: htmlToSend // html body
    });
};
exports.sendVerificationEmailForCloud = sendVerificationEmailForCloud;
//# sourceMappingURL=sendEmail.js.map