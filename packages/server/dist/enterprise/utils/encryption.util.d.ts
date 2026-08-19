export declare function getPasswordSaltRounds(): number;
/**
 * Extracts the cost factor (salt rounds) from a bcrypt hash using bcrypt.getRounds().
 * @returns The number of rounds used, or null if the string is not a valid bcrypt hash.
 */
export declare function getBcryptRoundsFromHash(hash: string): number | null;
/**
 * Checks if a stored bcrypt hash was created with fewer rounds than the current minimum,
 * and should be rehashed for stronger security.
 * @param storedHash The bcrypt hash stored in the database.
 * @param minRounds The minimum acceptable number of salt rounds (e.g. 10).
 */
export declare function hashNeedsUpgrade(storedHash: string, minRounds: number): boolean;
export declare function getHash(value: string): string;
export declare function compareHash(value1: string, value2: string): boolean;
export declare function encrypt(value: string): Promise<string>;
export declare function decrypt(value: string): Promise<string>;
