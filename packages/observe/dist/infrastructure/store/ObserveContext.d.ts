import { ReactNode } from 'react';
import { RequestInterceptor } from '../../core/types';
import { ExecutionsApi } from '../api';

interface ObserveApiContextValue {
    executions: ExecutionsApi;
}
export declare function useObserveApi(): ObserveApiContextValue;
interface ObserveConfigContextValue {
    isDarkMode: boolean;
    apiBaseUrl: string;
}
export declare function useObserveConfig(): ObserveConfigContextValue;
interface ObserveProviderProps {
    apiBaseUrl: string;
    token?: string;
    requestInterceptor?: RequestInterceptor;
    isDarkMode?: boolean;
    children: ReactNode;
}
export declare function ObserveProvider({ apiBaseUrl, token, requestInterceptor, isDarkMode, children }: ObserveProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
