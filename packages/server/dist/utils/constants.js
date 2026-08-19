"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LICENSE_QUOTAS = exports.DEFAULT_ALLOWED_OAUTH2_DOMAINS = exports.ALLOWED_OAUTH2_TOKEN_FIELDS = exports.INPUT_PARAMS_TYPE = exports.OMIT_QUEUE_JOB_DATA = exports.DOCUMENT_STORE_BASE_FOLDER = exports.API_KEY_BLACKLIST_URLS = exports.WHITELIST_URLS = void 0;
exports.WHITELIST_URLS = [
    '/api/verify/apikey/',
    '/api/chatflows/apikey/',
    '/api/public-chatflows',
    '/api/public-chatbotConfig',
    '/api/public-executions',
    '/api/prediction/',
    '/api/webhook/',
    '/api/chatmessage/abort',
    '/api/node-icon/',
    '/api/components-credentials-icon/',
    '/api/chatflows-streaming',
    '/api/chatflows-uploads',
    '/api/openai-assistants-file/download',
    '/api/feedback',
    '/api/leads',
    '/api/get-upload-file',
    '/api/ip',
    '/api/ping',
    '/api/version',
    '/api/attachments',
    '/api/auth/resolve',
    '/api/auth/login',
    '/api/auth/refreshToken',
    '/api/settings',
    '/api/account/logout',
    '/api/account/verify',
    '/api/account/register',
    '/api/account/resend-verification',
    '/api/account/forgot-password',
    '/api/account/reset-password',
    '/api/account/confirm-email-change',
    '/api/loginmethod/default',
    '/api/pricing',
    '/api/user/test',
    '/api/oauth2-credential/callback',
    '/api/oauth2-credential/refresh',
    '/api/mcp/',
    '/api/text-to-speech/generate',
    '/api/text-to-speech/abort',
    // Prefix match (not the exact LOGIN_URI/CALLBACK_URI/LOGOUT_URI strings) so ENTERPRISE mode's
    // org-scoped SSO paths (e.g. '/api/v1/azure/acme/login') are covered too, not just the bare
    // provider-global ones used in Cloud/OpenSource mode.
    // NOTE: these 4 stay on /api/v1 permanently (excluded from the /api/v1 -> /api alias in
    // index.ts) - their exact URL is registered as an "allowed callback URL" in each org's
    // external IdP app config.
    '/api/v1/azure/',
    '/api/v1/google/',
    '/api/v1/auth0/',
    '/api/v1/github/'
];
exports.API_KEY_BLACKLIST_URLS = ['/api/nvidia-nim', '/api/account/delete', '/api/files'];
exports.DOCUMENT_STORE_BASE_FOLDER = 'docustore';
exports.OMIT_QUEUE_JOB_DATA = [
    'componentNodes',
    'appDataSource',
    'sseStreamer',
    'telemetry',
    'cachePool',
    'usageCacheManager',
    'abortControllerPool'
];
exports.INPUT_PARAMS_TYPE = [
    'asyncOptions',
    'asyncMultiOptions',
    'options',
    'multiOptions',
    'array',
    'datagrid',
    'string',
    'number',
    'boolean',
    'password',
    'json',
    'code',
    'date',
    'file',
    'folder',
    'tabs'
];
exports.ALLOWED_OAUTH2_TOKEN_FIELDS = [
    'access_token',
    'refresh_token',
    'token_type',
    'expires_in',
    'scope',
    'id_token',
    'granted_scope'
];
exports.DEFAULT_ALLOWED_OAUTH2_DOMAINS = [
    'login.microsoftonline.com',
    'oauth2.googleapis.com',
    'accounts.google.com',
    'github.com',
    'login.salesforce.com',
    'test.salesforce.com',
    'oauth2.hubapi.com',
    'api.hubapi.com',
    'oauth.pipedrive.com',
    'app.clickup.com',
    'api.clickup.com',
    'login.xero.com',
    'identity.xero.com',
    'oauth2.sky.blackbaud.com',
    'app.asana.com',
    'todoist.com',
    'api.todoist.com',
    'slack.com',
    'oauth.pocketsmith.com',
    'api.notion.com',
    'api.dropboxapi.com',
    'api.box.com',
    'zoom.us',
    'auth.atlassian.com',
    'login.zoho.com',
    'accounts.zoho.com',
    'airtable.com',
    'api.linear.app',
    'discord.com',
    'api.pipedream.com'
];
exports.LICENSE_QUOTAS = {
    // Renew per month
    PREDICTIONS_LIMIT: 'quota:predictions',
    // Static
    FLOWS_LIMIT: 'quota:flows',
    USERS_LIMIT: 'quota:users',
    STORAGE_LIMIT: 'quota:storage',
    ADDITIONAL_SEATS_LIMIT: 'quota:additionalSeats'
};
//# sourceMappingURL=constants.js.map