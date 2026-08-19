import { LoggedInUser } from '../Interface.Enterprise';
export declare const generateSafeCopy: (user: Partial<LoggedInUser>, deleteEmail?: boolean) => any;
export declare const generateTempToken: () => string;
export declare const encryptToken: (stringToEncrypt: string) => string;
export declare const decryptToken: (stringToDecrypt: string) => string | undefined;
export declare const getUserUUIDFromToken: (token: string) => string | undefined;
export declare const isTokenValid: (tokenExpiry: Date, tokenType: TokenType) => boolean;
export declare enum TokenType {
    INVITE = "INVITE",
    PASSWORD_RESET = "PASSWORD_RESET"
}
