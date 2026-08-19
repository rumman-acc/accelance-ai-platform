/**
 * Generate the api key
 * @returns {string}
 */
export declare const generateAPIKey: () => string;
/**
 * Generate the secret key
 * @param {string} apiKey
 * @returns {string}
 */
export declare const generateSecretHash: (apiKey: string) => string;
/**
 * Verify valid keys
 * @param {string} storedKey
 * @param {string} suppliedKey
 * @returns {boolean}
 */
export declare const compareKeys: (storedKey: string, suppliedKey: string) => boolean;
