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

/**
 * Cascades analytics-provider config from Organization -> Workspace -> ChatFlow, most-specific
 * wins per provider key. workspaceAnalytic is optional so existing 2-arg call sites (and any
 * chatflow whose workspace has no override) keep working unchanged.
 */
export const mergeAnalyticsConfig = (
    organizationAnalytic?: string,
    workspaceAnalytic?: string,
    flowAnalytic?: string
): string | undefined => {
    const organizationConfig = parseAnalytics(organizationAnalytic)
    const workspaceConfig = parseAnalytics(workspaceAnalytic)
    const flowConfig = parseAnalytics(flowAnalytic)

    const mergedConfig = {
        ...organizationConfig,
        ...workspaceConfig,
        ...flowConfig
    }

    return Object.keys(mergedConfig).length ? JSON.stringify(mergedConfig) : undefined
}
