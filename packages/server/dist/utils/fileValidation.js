"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFileMimeTypeAndExtensionMatch = validateFileMimeTypeAndExtensionMatch;
exports.sanitizeAllowedUploadMimeTypesFromConfig = sanitizeAllowedUploadMimeTypesFromConfig;
const accelance_components_1 = require("accelance-components");
const internalAccelanceError_1 = require("../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const utils_1 = require("../errors/utils");
/**
 * Validates that file extension matches the declared MIME type with standardized error handling
 *
 * This function wraps validateMimeTypeAndExtensionMatch to provide consistent
 * error handling across the codebase. It prevents MIME type spoofing attacks
 * (CVE-2025-61687) by ensuring file extensions match declared MIME types.
 *
 * @param {string} filename The original filename
 * @param {string} mimetype The declared MIME type
 * @throws {InternalAccelanceError} If validation fails, throws BAD_REQUEST error
 * @example
 * ```typescript
 * validateFileMimeTypeAndExtensionMatch(file.originalname, file.mimetype)
 * ```
 */
function validateFileMimeTypeAndExtensionMatch(filename, mimetype) {
    try {
        (0, accelance_components_1.validateMimeTypeAndExtensionMatch)(filename, mimetype);
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, (0, utils_1.getErrorMessage)(error));
    }
}
/**
 * Sanitizes the allowedUploadFileTypes string from chatbotConfig by keeping only
 * MIME types that are in the server allow list. Removes any type not in the list
 * (e.g. executables) to prevent malicious clients from persisting dangerous types.
 *
 * @param {string} allowedTypesString Comma-separated MIME types from config
 * @returns {string} Comma-separated string of allowed MIME types only
 */
function sanitizeAllowedUploadMimeTypesFromConfig(allowedTypesString) {
    if (typeof allowedTypesString !== 'string')
        return '';
    const parts = allowedTypesString
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    return (0, accelance_components_1.filterAllowedUploadMimeTypes)(parts).join(',');
}
//# sourceMappingURL=fileValidation.js.map