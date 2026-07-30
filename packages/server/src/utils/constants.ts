export const WHITELIST_URLS = [
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
]

export const API_KEY_BLACKLIST_URLS = ['/api/nvidia-nim', '/api/account/delete', '/api/files']

export const enum GeneralErrorMessage {
    FORBIDDEN = 'Forbidden',
    UNAUTHORIZED = 'Unauthorized',
    UNHANDLED_EDGE_CASE = 'Unhandled Edge Case',
    INVALID_PASSWORD = 'Invalid Password',
    NOT_ALLOWED_TO_DELETE_OWNER = 'Not Allowed To Delete Owner',
    INTERNAL_SERVER_ERROR = 'Internal Server Error',
    SMTP_NOT_CONFIGURED = 'Email (SMTP) is not configured on this server'
}

export const enum GeneralSuccessMessage {
    CREATED = 'Resource Created Successful',
    UPDATED = 'Resource Updated Successful',
    DELETED = 'Resource Deleted Successful',
    FETCHED = 'Resource Fetched Successful',
    LOGGED_IN = 'Login Successful',
    LOGGED_OUT = 'Logout Successful'
}

export const DOCUMENT_STORE_BASE_FOLDER = 'docustore'

export const OMIT_QUEUE_JOB_DATA = [
    'componentNodes',
    'appDataSource',
    'sseStreamer',
    'telemetry',
    'cachePool',
    'usageCacheManager',
    'abortControllerPool'
]

export const INPUT_PARAMS_TYPE = [
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
]

export const ALLOWED_OAUTH2_TOKEN_FIELDS = [
    'access_token',
    'refresh_token',
    'token_type',
    'expires_in',
    'scope',
    'id_token',
    'granted_scope'
]

export const DEFAULT_ALLOWED_OAUTH2_DOMAINS = [
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
]

export const LICENSE_QUOTAS = {
    // Renew per month
    PREDICTIONS_LIMIT: 'quota:predictions',
    // Static
    FLOWS_LIMIT: 'quota:flows',
    USERS_LIMIT: 'quota:users',
    STORAGE_LIMIT: 'quota:storage',
    ADDITIONAL_SEATS_LIMIT: 'quota:additionalSeats'
} as const
