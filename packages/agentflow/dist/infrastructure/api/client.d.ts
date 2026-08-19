import { AxiosInstance } from 'axios'
import { RequestInterceptor } from '../../core/types'
import { DeduplicatedClient } from './deduplicatedClient'

/**
 * Creates a configured axios client for API calls
 * @param apiBaseUrl - Base URL of the Flowise server
 * @param token - Authentication token (optional)
 * @param requestInterceptor - Optional callback to customize outgoing requests
 */
export declare function bindApiClient(apiBaseUrl: string, token?: string, requestInterceptor?: RequestInterceptor): DeduplicatedClient
export type { AxiosInstance }
