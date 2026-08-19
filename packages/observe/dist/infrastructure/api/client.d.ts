import { AxiosInstance } from 'axios';
import { RequestInterceptor } from '../../core/types';

/**
 * Creates a configured axios instance for @accelance/observe API calls.
 * All internal SDK calls (executions list, get by id, delete) use this client.
 * The HITL prediction call is intentionally NOT made here — it is delegated to
 * the consumer via the onHumanInput prop so routing can differ between OSS and DevSite.
 *
 * @param apiBaseUrl - Base URL of the Flowise server
 * @param token - Optional API key — sets Authorization: Bearer header when provided
 * @param requestInterceptor - Optional callback to customize outgoing requests.
 *   Runs after the Bearer header is set, so it can extend or override auth headers.
 */
export declare function bindApiClient(apiBaseUrl: string, token?: string, requestInterceptor?: RequestInterceptor): AxiosInstance;
