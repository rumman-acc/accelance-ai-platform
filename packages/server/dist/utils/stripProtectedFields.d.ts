/**
 * Fields that are managed exclusively by the server and must never be
 * overwritten by user-supplied request bodies.
 */
export declare const PROTECTED_FIELDS: readonly ["id", "createdDate", "updatedDate", "runDate", "workspaceId", "organizationId", "webhookSecret", "webhookSecretConfigured"];
export type ProtectedField = (typeof PROTECTED_FIELDS)[number];
/**
 * Returns a shallow copy of `body` with all server-managed fields removed.
 * Use this before assigning a request body to a database entity to prevent
 * mass assignment of fields such as `workspaceId`, `id`, and timestamps.
 *
 * @example
 * Object.assign(entity, stripProtectedFields(req.body))
 */
export declare function stripProtectedFields<T extends Record<string, unknown>>(body: T): Omit<T, ProtectedField>;
