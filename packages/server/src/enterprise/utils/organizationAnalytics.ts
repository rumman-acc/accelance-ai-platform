import { ICommonObject } from 'accelance-components'

const parseAnalytics = (analytic?: string): ICommonObject => {
    if (!analytic) return {}

    try {
        const parsed = JSON.parse(analytic)
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
        return {}
    }
}

export const mergeAnalyticsConfig = (organizationAnalytic?: string, flowAnalytic?: string): string | undefined => {
    const organizationConfig = parseAnalytics(organizationAnalytic)
    const flowConfig = parseAnalytics(flowAnalytic)

    const mergedConfig = {
        ...organizationConfig,
        ...flowConfig
    }

    return Object.keys(mergedConfig).length ? JSON.stringify(mergedConfig) : undefined
}
