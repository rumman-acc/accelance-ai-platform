'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.applyCompactTableTransformer = applyCompactTableTransformer
/**
 * Overrides the default table block handler on a NotionAPILoader instance
 * to produce compact markdown tables without the excessive cell padding
 * added by the markdown-table library's default options.
 */
function applyCompactTableTransformer(loader) {
    const internal = loader
    const n2m = internal.n2mClient
    const notionClient = internal.notionClient
    n2m.setCustomTransformer('table', async (block) => {
        try {
            const tableBlock = block
            const { id, has_children } = tableBlock
            const { has_column_header } = tableBlock.table
            if (!has_children) return ''
            // Fetch all table row blocks using the public Notion API
            const childBlocks = await fetchAllChildBlocks(notionClient, id)
            // Convert each row's cells to markdown strings
            const tableArr = []
            for (const child of childBlocks) {
                const row = child
                const cells = row.table_row?.cells || []
                const cellStrings = []
                for (const cell of cells) {
                    const raw = await n2m.blockToMarkdown({
                        type: 'paragraph',
                        paragraph: { rich_text: cell }
                    })
                    const cleaned = escapeForTable(raw)
                    cellStrings.push(cleaned)
                }
                tableArr.push(cellStrings)
            }
            if (tableArr.length === 0) return ''
            // Build the markdown table
            const columnCount = tableArr[0].length
            const headerArray = has_column_header ? tableArr[0] : new Array(columnCount).fill('')
            const dataRows = has_column_header ? tableArr.slice(1) : tableArr
            const header = formatRow(headerArray)
            const separator = formatRow(new Array(columnCount).fill('---'))
            const rows = dataRows.map(formatRow)
            return [header, separator, ...rows].join('\n')
        } catch {
            // Fall back to the default (padded) table handler rather than failing the entire load
            return false
        }
    })
}
/**
 * Fetches all child blocks for a given block ID, handling pagination.
 */
async function fetchAllChildBlocks(notionClient, blockId) {
    const blocks = []
    let cursor = undefined
    do {
        const response = await notionClient.blocks.children.list({
            block_id: blockId,
            start_cursor: cursor
        })
        blocks.push(...response.results)
        cursor = response.has_more ? response.next_cursor ?? undefined : undefined
    } while (cursor)
    return blocks
}
/**
 * Cleans a blockToMarkdown result for use inside a table cell:
 * - Trims surrounding whitespace and trailing newlines
 * - Replaces internal newlines with spaces
 * - Escapes backslashes and pipes to preserve table structure
 */
function escapeForTable(raw) {
    const trimmed = raw.trim()
    const singleLine = trimmed.replace(/\n/g, ' ')
    const escapedBackslashes = singleLine.replace(/\\/g, '\\\\')
    const escapedPipes = escapedBackslashes.replace(/\|/g, '\\|')
    return escapedPipes
}
/**
 * Formats an array of cell strings into a markdown table row.
 */
function formatRow(cells) {
    return '| ' + cells.join(' | ') + ' |'
}
//# sourceMappingURL=notionTableFix.js.map
