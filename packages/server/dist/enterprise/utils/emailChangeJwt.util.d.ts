export declare const EMAIL_CHANGE_JWT_TYP = "email_change";
export declare function signEmailChangeJwt(userId: string, newEmail: string, expiryHours: number): {
    token: string;
    tokenExpiry: Date;
};
export declare function verifyEmailChangeJwt(token: string): {
    userId: string;
    newEmail: string;
};
export declare function isEmailChangeJwtShape(token: string | undefined | null): token is string;
