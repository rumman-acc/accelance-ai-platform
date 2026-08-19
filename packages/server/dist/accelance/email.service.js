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
exports.sendInviteEmail = sendInviteEmail;
const nodemailer = __importStar(require("nodemailer"));
let _transporter = null;
function getTransporter() {
    if (_transporter)
        return _transporter;
    const pass = process.env.SMTP_PASS;
    if (!pass)
        return null;
    _transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER || 'b050b6001@smtp-brevo.com',
            pass
        }
    });
    return _transporter;
}
async function sendInviteEmail(params) {
    const { to, inviteUrl, inviterName, orgName } = params;
    const t = getTransporter();
    if (!t) {
        console.log(`[EMAIL SKIPPED — set SMTP_PASS to send] Invite to ${to} → ${inviteUrl}`);
        return;
    }
    const from = process.env.SMTP_FROM || 'noreply@accelance.io';
    await t.sendMail({
        from,
        to,
        subject: `${inviterName} invited you to join ${orgName} on Accelance AI`,
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
                <h2 style="margin: 0 0 8px;">You're invited!</h2>
                <p style="color: #555; margin: 0 0 24px;">
                    <strong>${inviterName}</strong> has invited you to join
                    <strong>${orgName}</strong> on Accelance AI.
                </p>
                <a href="${inviteUrl}"
                   style="display: inline-block; background: #2563eb; color: #fff;
                          text-decoration: none; padding: 12px 24px; border-radius: 8px;
                          font-weight: 600;">
                    Accept Invite
                </a>
                <p style="color: #999; font-size: 12px; margin: 24px 0 0;">
                    This link expires in 24 hours. If you didn't expect this, ignore this email.
                </p>
            </div>
        `
    });
}
//# sourceMappingURL=email.service.js.map