/**
 * Bedrock-specific utilities for the AWS Bedrock Converse node.
 *
 * This module centralizes all Bedrock model resolution logic:
 *
 * - **validateEndpointHost** — Sanitizes the endpointHost field. Auto-migrates
 *   ARNs that users mistakenly placed there (the original "invalid URL" bug).
 *
 * - **discoverInferenceProfiles** — Runtime discovery of which inference profiles
 *   exist in a given region via the Bedrock control-plane API. Cached per region.
 *   @see https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html
 *
 * - **resolveBedrockModel** — Determines the correct model ID and optional
 *   applicationInferenceProfile for a Converse API call. Handles ARNs,
 *   geo-prefixed profile IDs, and auto-application of profiles for models
 *   that require them.
 *   @see https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-use.html
 *
 * - **getStopSeqUnsupportedModels** — Loads the set of models that reject the
 *   stopSequences inference config field, read from models.json (`stop_sequences: false`).
 *
 * - **normalizeBedrockError** — Rewrites raw Bedrock Converse API errors into
 *   actionable user-facing messages.
 *
 * All model metadata (inference profile geos, stop_sequences flags) lives in
 * models.json as the single source of truth, loaded via the model loader.
 */
export interface EndpointHostResult {
    /** The sanitized hostname to use, or undefined if the value was an ARN/URL that should be ignored. */
    hostname?: string;
    /** If the value looked like an ARN, it is returned here so init() can treat it as a model target. */
    migratedArn?: string;
}
/**
 * Inspects the endpointHost value and decides what to do with it.
 *
 * - Bare hostname (valid) → returned as-is.
 * - ARN (common misconfiguration) → stripped from endpointHost and
 *   returned as `migratedArn` so init() can route it to the inference
 *   profile path.  This provides backward compatibility for existing
 *   flows that placed ARNs in the wrong field.
 * - URL with scheme → hostname extracted and returned with a console
 *   warning.
 */
export declare function validateEndpointHost(value: string): EndpointHostResult;
/**
 * Discovers which system-defined inference profiles are available in a
 * given region by calling the Bedrock control-plane API.  Results are
 * cached in-memory for the process lifetime.
 *
 * This is necessary because inference profile availability is per-region,
 * not per-geo. For example, `eu.amazon.nova-pro-v1:0` exists in eu-west-1
 * but NOT in eu-west-2, even though both are EU regions.
 *
 * Uses the same credentials the user configured on the Bedrock node
 * (UI creds, AssumeRole, or SDK default chain).
 *
 * Note: The API paginates (~13 results per page despite maxResults: 100),
 * so we loop on nextToken to get the full list.
 *
 * On any error (auth failure, region not supported, etc.) returns an
 * empty set — the caller falls back to direct invocation without a profile.
 *
 * @see https://docs.aws.amazon.com/bedrock/latest/APIReference/API_ListInferenceProfiles.html
 */
export declare function discoverInferenceProfiles(region: string, credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
}): Promise<Set<string>>;
/** Exported for testing — resets the region profile cache. */
export declare function _resetRegionProfileCache(): void;
export declare function getStopSeqUnsupportedModels(): Promise<Set<string>>;
/** Exported for testing — resets the stop-sequence cache. */
export declare function _resetStopSeqCache(): void;
/** Exported for testing -- resets the cached map so tests can control it. */
export declare function _resetInferenceProfileCache(): void;
/**
 * Returns an ordered list of geo-prefix candidates for a given AWS region.
 * The first match against a model's `inference_profile_geos` wins.
 *
 * Some regions have unique prefixes (jp for Tokyo, ca for Canada)
 * alongside broader geo prefixes. The fallback chain in
 * resolveBedrockModel() appends `global` and `us` after these candidates.
 *
 * Source: `aws bedrock list-inference-profiles --type-equals SYSTEM_DEFINED`
 * across us-east-1, us-west-2, eu-west-1, eu-central-1, ap-southeast-1,
 * ap-northeast-1, ca-central-1, sa-east-1 (2026-04-16).
 */
export declare function regionToGeoCandidates(region: string): string[];
export interface ResolvedBedrockModel {
    /** The base model ID (used for metadata, pricing lookup, etc.). */
    modelId: string;
    /** Set when the target requires profile-routed inference. */
    applicationInferenceProfile?: string;
}
/**
 * Accepts whatever the user typed into `customModel` (or the dropdown
 * selection) and returns the values that should be passed to
 * ChatBedrockConverseInput.
 *
 * Detection logic:
 *
 * 1. ARN (`arn:aws:bedrock:…`) → treated as an inference-profile or
 *    provisioned-model ARN.  The dropdown model is kept as `modelId`
 *    for metadata.
 * 2. Geo-prefixed ID (`us.`, `eu.`, `apac.`, `global.`) → cross-region
 *    inference profile.  The prefix is stripped to derive `modelId`.
 * 3. Plain model ID → passed through as `modelId`.
 * 4. Empty / undefined → falls back to `dropdownModel`.
 *
 * After detection, if no explicit profile was set, the model's
 * `inference_profile_geos` from models.json is checked.  The best
 * geo is chosen by trying candidates from regionToGeoCandidates()
 * in order, then falling back to global → us → none.
 *
 * When `useGlobalEndpoint` is true, skips regional candidates and
 * tries `global.*` first. Falls back to normal selection if the model
 * has no global profile.
 *
 * @see https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html
 * @see https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html
 */
export declare function resolveBedrockModel(customModel: string | undefined, dropdownModel: string, region?: string, availableProfiles?: Set<string>, useGlobalEndpoint?: boolean): Promise<ResolvedBedrockModel>;
/**
 * Rewrites common Bedrock Converse runtime errors into actionable messages.
 *
 * Handled patterns:
 * - "inference profile" / "on-demand throughput" → guides user to select model from dropdown
 * - "doesn't support Converse" → suggests providing imported model ARN in Custom Model ARN field
 * - "doesn't support ... field" → explains some models reject certain inference config params
 *
 * Returns the original error unchanged if no pattern matches.
 *
 * @see https://docs.aws.amazon.com/bedrock/latest/userguide/troubleshooting-api-error-codes.html
 */
export declare function normalizeBedrockError(err: unknown): Error;
