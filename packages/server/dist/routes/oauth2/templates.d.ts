/**
 * HTML Templates for OAuth2 Callback Pages
 *
 * This module contains reusable HTML templates for OAuth2 authorization responses.
 * The templates provide consistent styling and behavior for success and error pages.
 */
export interface OAuth2PageOptions {
    title: string;
    statusIcon: string;
    statusText: string;
    statusColor: string;
    message: string;
    details?: string;
    postMessageType: 'OAUTH2_SUCCESS' | 'OAUTH2_ERROR';
    postMessageData: any;
    autoCloseDelay: number;
}
export declare const generateOAuth2ResponsePage: (options: OAuth2PageOptions) => string;
export declare const generateSuccessPage: (credentialId: string) => string;
export declare const generateErrorPage: (error: string, message: string, details?: string) => string;
