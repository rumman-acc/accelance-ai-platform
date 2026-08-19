"use strict";
/**
 * HTML Templates for OAuth2 Callback Pages
 *
 * This module contains reusable HTML templates for OAuth2 authorization responses.
 * The templates provide consistent styling and behavior for success and error pages.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateErrorPage = exports.generateSuccessPage = exports.generateOAuth2ResponsePage = void 0;
/**
 * Escapes HTML special characters to prevent XSS attacks
 */
const escapeHtml = (unsafe) => {
    return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
};
const generateOAuth2ResponsePage = (options) => {
    const { title, statusIcon, statusText, statusColor, message, details, postMessageType, postMessageData, autoCloseDelay } = options;
    // Escape all user-controlled content to prevent XSS
    const safeTitle = escapeHtml(title);
    const safeStatusIcon = escapeHtml(statusIcon);
    const safeStatusText = escapeHtml(statusText);
    const safeMessage = escapeHtml(message);
    const safeDetails = details ? escapeHtml(details) : undefined;
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${safeTitle}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f5f5f5;
                }
                .container {
                    text-align: center;
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    max-width: 500px;
                }
                .status {
                    color: ${statusColor};
                    font-size: 1.2rem;
                    margin-bottom: 1rem;
                }
                .message {
                    color: #666;
                    margin-bottom: 1rem;
                }
                .details {
                    background: #f9f9f9;
                    padding: 1rem;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    color: #333;
                    text-align: left;
                    margin-top: 1rem;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="status">${safeStatusIcon} ${safeStatusText}</div>
                <div class="message">${safeMessage}</div>
                ${safeDetails ? `<div class="details">${safeDetails}</div>` : ''}
            </div>
            <script>
                // Notify parent window
                try {
                    if (window.opener) {
                        window.opener.postMessage(${JSON.stringify({
        type: postMessageType,
        ...postMessageData
    })}, '*');
                    }
                } catch (error) {
                    console.log('Could not notify parent window:', error);
                }

                // Close window after delay
                setTimeout(function() {
                    window.close();
                }, ${autoCloseDelay});
            </script>
        </body>
        </html>
    `;
};
exports.generateOAuth2ResponsePage = generateOAuth2ResponsePage;
const generateSuccessPage = (credentialId) => {
    return (0, exports.generateOAuth2ResponsePage)({
        title: 'OAuth2 Authorization Success',
        statusIcon: '✓',
        statusText: 'Authorization Successful',
        statusColor: '#4caf50',
        message: 'You can close this window now.',
        postMessageType: 'OAUTH2_SUCCESS',
        postMessageData: {
            credentialId,
            success: true,
            message: 'OAuth2 authorization completed successfully'
        },
        autoCloseDelay: 1000
    });
};
exports.generateSuccessPage = generateSuccessPage;
const generateErrorPage = (error, message, details) => {
    return (0, exports.generateOAuth2ResponsePage)({
        title: 'OAuth2 Authorization Error',
        statusIcon: '✗',
        statusText: 'Authorization Failed',
        statusColor: '#f44336',
        message,
        details,
        postMessageType: 'OAUTH2_ERROR',
        postMessageData: {
            success: false,
            message,
            error
        },
        autoCloseDelay: 3000
    });
};
exports.generateErrorPage = generateErrorPage;
//# sourceMappingURL=templates.js.map