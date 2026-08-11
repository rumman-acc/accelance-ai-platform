// Curated classification of the platform's native component-node catalog
// (the 'Tools' and 'Tools (MCP)' backend categories) into the three concepts
// surfaced on the Tools page:
//   - Native Tools      — generic capabilities, not tied to one external business account
//   - Native Connectors — named third-party service integrations, implemented directly
//   - Native MCP Servers — built-in connectors implemented via the MCP protocol
// There's no first-class field on the node definition for this distinction, so the
// split is maintained here by node `name` (the technical identifier, not the label).

// 'Tools' category nodes that are a named integration to one specific external
// business system (OAuth/API-key tied to a real vendor account). Everything else
// in the 'Tools' category is treated as a generic capability ("Native Tools").
export const NATIVE_CONNECTOR_NAMES = new Set([
    'gmail',
    'googleDriveTool',
    'googleDocsTool',
    'googleSheetsTool',
    'googleCalendarTool',
    'microsoftOutlook',
    'microsoftTeams',
    'jiraTool',
    'awsDynamoDBKVStorage',
    'awsSNS',
    'stripeAgentTool',
    'composio',
    // Added 2026-08-11 from market-gap analysis (see rules/epics-feature-status.md)
    'salesforceTool',
    'hubspotTool',
    'discordTool',
    'twilioTool',
    'airtableTool',
    'docusignTool',
    'shopifyTool'
])

// User-driven/custom mechanisms — surfaced on the Custom Tools / Custom MCP Servers
// tabs instead of the Native tabs, even though they live in the same backend categories.
export const CUSTOM_MECHANISM_NAMES = new Set(['customTool', 'customMCP', 'customMcpServerTool'])
