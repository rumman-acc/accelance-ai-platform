export declare function isInvalidUUID(id: unknown): boolean;
export declare function isInvalidEmail(email: unknown): boolean;
export declare function isInvalidName(name: unknown): boolean;
export declare function isInvalidDateTime(dateTime: unknown): boolean;
export declare function isInvalidPassword(password: unknown): boolean;
/**
 * Validates the password and throws an Error with a descriptive message if invalid.
 * No-op when the password is valid.
 * @throws Error with message "Invalid password: Must contain ..." or "Invalid password: Password is required."
 */
export declare function validatePasswordOrThrow(password: unknown): void;
