import { Platform } from '../../Interface';
declare const _default: {
    getSettings: () => Promise<{
        PLATFORM_TYPE?: undefined;
    } | {
        PLATFORM_TYPE: Platform;
    }>;
};
export default _default;
