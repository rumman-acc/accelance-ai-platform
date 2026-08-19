/**
 * Validates if a string is a valid UUID v4
 * @param {string} uuid The string to validate
 * @returns {boolean} True if valid UUID, false otherwise
 */
export declare const isValidUUID: (uuid: string) => boolean;
/**
 * Validates if a string is a valid URL safe for interpolation into JS code.
 * Rejects hash fragments (the exploit entry point), non-http(s) protocols,
 * and characters that can break out of JS string literals — double quotes,
 * single quotes, backticks (template literals), backslashes, and newlines.
 */
export declare const isValidURL: (url: string) => boolean;
/**
 * Validates if a string contains path traversal attempts
 * @param {string} path The string to validate
 * @returns {boolean} True if path traversal detected, false otherwise
 */
export declare const isPathTraversal: (path: string) => boolean;
/**
 * Enhanced path validation for workspace-scoped file operations
 * @param {string} filePath The file path to validate
 * @returns {boolean} True if path traversal detected, false otherwise
 */
export declare const isUnsafeFilePath: (filePath: string) => boolean;
/**
 * Validates that file extension matches the declared MIME type
 *
 * This function addresses CVE-2025-61687 by preventing MIME type spoofing attacks.
 * It ensures that the file extension matches the declared MIME type, preventing
 * attackers from uploading malicious files (e.g., .js file with text/plain MIME type).
 *
 * @param {string} filename The original filename
 * @param {string} mimetype The declared MIME type
 * @returns {void} Throws an error if validation fails
 */
export declare const validateMimeTypeAndExtensionMatch: (filename: string, mimetype: string) => void;
/**
 * Filters an array of MIME type strings to only those allowed for file upload config.
 * Used when sanitizing chatbotConfig.allowedUploadFileTypes to prevent malicious values.
 * @param {string[]} mimeTypes Raw MIME types (e.g. from splitting comma-separated config)
 * @returns {string[]} Only MIME types that pass isAllowedUploadMimeType
 */
export declare const filterAllowedUploadMimeTypes: (mimeTypes: string[]) => string[];
/**
 * Validates and sanitizes a vector store base path to prevent path traversal attacks
 *
 * This function addresses path traversal vulnerabilities in vector stores (Faiss, SimpleStore)
 * by ensuring user-provided paths cannot escape allowed directories.
 *
 * @param {string | undefined} userProvidedPath The base path provided by user (can be empty/undefined)
 * @returns {string} A validated, absolute path within allowed directories
 * @throws {Error} If path validation fails or path is outside allowed directories
 */
export declare const validateVectorStorePath: (userProvidedPath: string | undefined) => string;
/**
 * Validates and sanitizes a SQLite database file path to prevent path traversal
 * and arbitrary file write attacks.
 *
 * Relative paths are resolved within ~/.flowise/. Absolute paths must fall inside
 * ~/.flowise/ or DATABASE_PATH when set. Set PATH_TRAVERSAL_SAFETY=false to bypass all checks (not recommended).
 *
 * @param {string | undefined} userProvidedPath - File path supplied by the user in the node config
 * @returns {string} A validated, absolute path within an allowed base directory
 * @throws {Error} If the path is missing, contains traversal patterns, or is outside allowed directories
 */
export declare const validateSQLitePath: (userProvidedPath: string | undefined) => string;
/**
 * Sanitize a file name to prevent path traversal attacks.
 * Strips common storage prefixes, extracts the basename, runs it through
 * the `sanitize-filename` package, and rejects anything that still looks unsafe.
 *
 * @param {string} name The file name to sanitize
 */
export declare const sanitizeFileName: (name: string) => string;
