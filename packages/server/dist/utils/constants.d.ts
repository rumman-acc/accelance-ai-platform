export declare const WHITELIST_URLS: string[];
export declare const API_KEY_BLACKLIST_URLS: string[];
export declare const enum GeneralErrorMessage {
    FORBIDDEN = "Forbidden",
    UNAUTHORIZED = "Unauthorized",
    UNHANDLED_EDGE_CASE = "Unhandled Edge Case",
    INVALID_PASSWORD = "Invalid Password",
    NOT_ALLOWED_TO_DELETE_OWNER = "Not Allowed To Delete Owner",
    INTERNAL_SERVER_ERROR = "Internal Server Error",
    SMTP_NOT_CONFIGURED = "Email (SMTP) is not configured on this server"
}
export declare const enum GeneralSuccessMessage {
    CREATED = "Resource Created Successful",
    UPDATED = "Resource Updated Successful",
    DELETED = "Resource Deleted Successful",
    FETCHED = "Resource Fetched Successful",
    LOGGED_IN = "Login Successful",
    LOGGED_OUT = "Logout Successful"
}
export declare const DOCUMENT_STORE_BASE_FOLDER = "docustore";
export declare const OMIT_QUEUE_JOB_DATA: string[];
export declare const INPUT_PARAMS_TYPE: string[];
export declare const ALLOWED_OAUTH2_TOKEN_FIELDS: string[];
export declare const DEFAULT_ALLOWED_OAUTH2_DOMAINS: string[];
export declare const LICENSE_QUOTAS: {
    readonly PREDICTIONS_LIMIT: "quota:predictions";
    readonly FLOWS_LIMIT: "quota:flows";
    readonly USERS_LIMIT: "quota:users";
    readonly STORAGE_LIMIT: "quota:storage";
    readonly ADDITIONAL_SEATS_LIMIT: "quota:additionalSeats";
};
