/**
 * Returns the appropriate default value for an input based on its type.
 * If a `default` is provided, it is returned as-is.
 *
 * Accepts a destructured object so it stays decoupled from any domain type
 * (InputParam, CredentialSchemaInput, etc.) while allowing callers to pass
 * those objects directly.
 */
export declare function getDefaultValueForType({
    type,
    default: defaultValue
}: {
    type: string
    default?: unknown
    options?: Array<
        | {
              name: string
          }
        | string
    >
}): unknown
