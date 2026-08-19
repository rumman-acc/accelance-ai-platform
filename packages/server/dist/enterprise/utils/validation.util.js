"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInvalidUUID = isInvalidUUID;
exports.isInvalidEmail = isInvalidEmail;
exports.isInvalidName = isInvalidName;
exports.isInvalidDateTime = isInvalidDateTime;
exports.isInvalidPassword = isInvalidPassword;
exports.validatePasswordOrThrow = validatePasswordOrThrow;
function isInvalidUUID(id) {
    const regexUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return !id || typeof id !== 'string' || !regexUUID.test(id);
}
function isInvalidEmail(email) {
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return !email || typeof email !== 'string' || email.length > 255 || !regexEmail.test(email);
}
function isInvalidName(name) {
    return !name || typeof name !== 'string' || name.length > 100;
}
function isInvalidDateTime(dateTime) {
    const regexDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
    return !dateTime || typeof dateTime !== 'string' || !regexDateTime.test(dateTime);
}
function isInvalidPassword(password) {
    // Minimum Length: At least 8 characters
    // Maximum Length: No more than 128 characters
    // Lowercase Letter: Must contain at least one lowercase letter (a-z)
    // Uppercase Letter: Must contain at least one uppercase letter (A-Z)
    // Digit: Must contain at least one number (0-9)
    // Special Character: Must contain at least one special character (anything that's not a letter or number)
    if (!password || typeof password !== 'string' || password.length > 128) {
        return true;
    }
    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    return !regexPassword.test(password);
}
/**
 * Validates the password and throws an Error with a descriptive message if invalid.
 * No-op when the password is valid.
 * @throws Error with message "Invalid password: Must contain ..." or "Invalid password: Password is required."
 */
function validatePasswordOrThrow(password) {
    if (!isInvalidPassword(password))
        return;
    if (typeof password !== 'string') {
        throw new Error('Invalid password: Password is required.');
    }
    const errors = [];
    if (!/(?=.*[a-z])/.test(password))
        errors.push('at least one lowercase letter');
    if (!/(?=.*[A-Z])/.test(password))
        errors.push('at least one uppercase letter');
    if (!/(?=.*\d)/.test(password))
        errors.push('at least one number');
    if (!/(?=.*[^a-zA-Z0-9])/.test(password))
        errors.push('at least one special character');
    if (password.length < 8)
        errors.push('minimum length of 8 characters');
    if (password.length > 128)
        errors.push('less than or equal to 128 characters');
    throw new Error(`Invalid password: Must contain ${errors.join(', ')}`);
}
//# sourceMappingURL=validation.util.js.map