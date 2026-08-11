import { useEffect, useMemo } from 'react'

// project imports
import useApi from '@/hooks/useApi'
import { baseURL, NATIVE_TOOL_CONFIG_STATUS } from '@/store/constant'
import { NATIVE_CONNECTOR_NAMES, CUSTOM_MECHANISM_NAMES } from '@/store/nativeToolsClassification'

// API
import nodesApi from '@/api/nodes'
import credentialsApi from '@/api/credentials'

// Fetches the native ('Tools' + 'Tools (MCP)') component-node catalog and the
// workspace's configured credentials once, then classifies the catalog into the
// three concepts surfaced on the Tools page: generic Tools, named Connectors,
// and built-in MCP Servers. Shared by all three Native tabs so switching between
// them doesn't refetch.
export default function useNativeToolsCatalog() {
    const toolsCategoryApi = useApi(() => nodesApi.getNodesByCategory('Tools'))
    const mcpCategoryApi = useApi(() => nodesApi.getNodesByCategory('Tools (MCP)'))
    const credentialsListApi = useApi(credentialsApi.getAllCredentials)

    useEffect(() => {
        toolsCategoryApi.request()
        mcpCategoryApi.request()
        credentialsListApi.request()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const isLoading = toolsCategoryApi.loading || mcpCategoryApi.loading || credentialsListApi.loading

    const configuredCredentialNames = useMemo(() => {
        const list = credentialsListApi.data || []
        return new Set(list.map((c) => c.credentialName))
    }, [credentialsListApi.data])

    const toCatalogItem = (node) => {
        const credentialNames = node.credential?.credentialNames || []
        let configStatus = NATIVE_TOOL_CONFIG_STATUS.NO_SETUP_NEEDED
        if (credentialNames.length > 0) {
            const hasConfigured = credentialNames.some((name) => configuredCredentialNames.has(name))
            configStatus = hasConfigured ? NATIVE_TOOL_CONFIG_STATUS.CONFIGURED : NATIVE_TOOL_CONFIG_STATUS.SETUP_REQUIRED
        }
        return {
            name: node.name,
            label: node.label,
            description: node.description,
            iconSrc: `${baseURL}/api/node-icon/${node.name}`,
            configStatus,
            credentialNames
        }
    }

    const { tools, connectors } = useMemo(() => {
        const toolsCategory = (toolsCategoryApi.data || []).filter((node) => !CUSTOM_MECHANISM_NAMES.has(node.name))
        return {
            connectors: toolsCategory.filter((node) => NATIVE_CONNECTOR_NAMES.has(node.name)).map(toCatalogItem),
            tools: toolsCategory.filter((node) => !NATIVE_CONNECTOR_NAMES.has(node.name)).map(toCatalogItem)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toolsCategoryApi.data, configuredCredentialNames])

    const mcpServers = useMemo(() => {
        return (mcpCategoryApi.data || []).filter((node) => !CUSTOM_MECHANISM_NAMES.has(node.name)).map(toCatalogItem)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mcpCategoryApi.data, configuredCredentialNames])

    return { isLoading, tools, connectors, mcpServers }
}
