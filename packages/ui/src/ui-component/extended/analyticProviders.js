import langsmithPNG from '@/assets/images/langchain.png'
import langfuseSVG from '@/assets/images/langfuse.svg'
import lunarySVG from '@/assets/images/lunary.svg'
import langwatchSVG from '@/assets/images/langwatch.svg'
import arizePNG from '@/assets/images/arize.png'
import phoenixPNG from '@/assets/images/phoenix.png'
import opikPNG from '@/assets/images/opik.png'

// Shared provider list consumed by every level of the analytics cascade (chatflow, workspace,
// organization) and the bulk-apply dialog, so the provider set and its input schema only ever
// live in one place. See accelance-components/src/handler.ts for the matching backend handlers.
export const analyticProviders = [
    {
        label: 'LangSmith',
        name: 'langSmith',
        icon: langsmithPNG,
        url: 'https://smith.langchain.com',
        inputs: [
            {
                label: 'Connect Credential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['langsmithApi']
            },
            {
                label: 'Project Name',
                name: 'projectName',
                type: 'string',
                optional: true,
                description: 'If not provided, default will be used',
                placeholder: 'default'
            },
            {
                label: 'On/Off',
                name: 'status',
                type: 'boolean',
                optional: true
            }
        ]
    },
    {
        label: 'LangFuse',
        name: 'langFuse',
        icon: langfuseSVG,
        url: 'https://langfuse.com',
        inputs: [
            {
                label: 'Connect Credential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['langfuseApi']
            },
            {
                label: 'Release',
                name: 'release',
                type: 'string',
                optional: true,
                description: 'The release number/hash of the application to provide analytics grouped by release'
            },
            {
                label: 'On/Off',
                name: 'status',
                type: 'boolean',
                optional: true
            }
        ]
    },
    {
        label: 'Lunary',
        name: 'lunary',
        icon: lunarySVG,
        url: 'https://lunary.ai',
        inputs: [
            {
                label: 'Connect Credential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['lunaryApi']
            },
            {
                label: 'On/Off',
                name: 'status',
                type: 'boolean',
                optional: true
            }
        ]
    },
    {
        label: 'LangWatch',
        name: 'langWatch',
        icon: langwatchSVG,
        url: 'https://langwatch.ai',
        inputs: [
            {
                label: 'Connect Credential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['langwatchApi']
            },
            {
                label: 'On/Off',
                name: 'status',
                type: 'boolean',
                optional: true
            }
        ]
    },
    {
        label: 'Arize',
        name: 'arize',
        icon: arizePNG,
        url: 'https://arize.com',
        inputs: [
            {
                label: 'Connect Credential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['arizeApi']
            },
            {
                label: 'Project Name',
                name: 'projectName',
                type: 'string',
                optional: true,
                description: 'If not provided, default will be used.',
                placeholder: 'default'
            },
            {
                label: 'On/Off',
                name: 'status',
                type: 'boolean',
                optional: true
            }
        ]
    },
    {
        label: 'Phoenix',
        name: 'phoenix',
        icon: phoenixPNG,
        url: 'https://phoenix.arize.com',
        inputs: [
            {
                label: 'Connect Credential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['phoenixApi']
            },
            {
                label: 'Project Name',
                name: 'projectName',
                type: 'string',
                optional: true,
                description: 'If not provided, default will be used.',
                placeholder: 'default'
            },
            {
                label: 'On/Off',
                name: 'status',
                type: 'boolean',
                optional: true
            }
        ]
    },
    {
        label: 'Opik',
        name: 'opik',
        icon: opikPNG,
        url: 'https://www.comet.com/opik',
        inputs: [
            {
                label: 'Connect Credential',
                name: 'credential',
                type: 'credential',
                credentialNames: ['opikApi']
            },
            {
                label: 'Project Name',
                name: 'opikProjectName',
                type: 'string',
                description: 'Name of your Opik project',
                placeholder: 'default'
            },
            {
                label: 'On/Off',
                name: 'status',
                type: 'boolean',
                optional: true
            }
        ]
    }
]

/**
 * Every non-optional, non-boolean input a provider declares (credential + any required text
 * field, e.g. Opik's project name) that is still empty while that provider is turned on.
 * Returns [] when the provider is off, or config is missing entirely — nothing to enforce.
 */
export const getMissingRequiredInputs = (providerConfig, provider) => {
    if (!providerConfig?.status) return []
    return provider.inputs.filter((input) => {
        if (input.optional || input.type === 'boolean') return false
        if (input.type === 'credential') return !providerConfig.credentialId
        return !providerConfig[input.name]
    })
}

/**
 * Validates a full `{ [providerName]: {...} }` analytic config, e.g. before it's saved.
 * Returns one entry per provider that is on but missing a required input — most commonly its
 * credential — so the caller can block the save and tell the user which provider(s) need it.
 */
export const validateAnalyticConfig = (value = {}) => {
    return analyticProviders
        .map((provider) => ({ provider, missing: getMissingRequiredInputs(value[provider.name], provider) }))
        .filter(({ missing }) => missing.length > 0)
}

export default analyticProviders
