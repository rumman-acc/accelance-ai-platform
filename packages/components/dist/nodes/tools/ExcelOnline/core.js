'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createExcelOnlineTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to access Excel Online API for reading and writing Excel workbooks in OneDrive/SharePoint`
const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0'
// Define schemas for different Excel Online operations
const ListWorksheetsSchema = v3_1.z.object({
    itemId: v3_1.z.string().describe("The workbook file's Graph drive-item ID")
})
const GetRangeSchema = v3_1.z.object({
    itemId: v3_1.z.string().describe("The workbook file's Graph drive-item ID"),
    worksheetName: v3_1.z.string().describe('Name of the worksheet'),
    address: v3_1.z.string().describe('Cell range, e.g. A1:C10')
})
const UpdateRangeSchema = v3_1.z.object({
    itemId: v3_1.z.string().describe("The workbook file's Graph drive-item ID"),
    worksheetName: v3_1.z.string().describe('Name of the worksheet'),
    address: v3_1.z.string().describe('Cell range, e.g. A1:C10'),
    valuesJson: v3_1.z.string().describe('JSON 2D array as a string, e.g. "[[1,2],[3,4]]" -- parse it before sending')
})
const AddTableRowSchema = v3_1.z.object({
    itemId: v3_1.z.string().describe("The workbook file's Graph drive-item ID"),
    tableName: v3_1.z.string().describe('Name of the table'),
    valuesJson: v3_1.z.string().describe('JSON 2D array as a string, e.g. "[[1,2,3]]" -- parse it before sending')
})
const ListTablesSchema = v3_1.z.object({
    itemId: v3_1.z.string().describe("The workbook file's Graph drive-item ID")
})
class BaseExcelOnlineTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.accessToken = ''
        this.accessToken = args.accessToken ?? ''
    }
    async makeExcelOnlineRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${GRAPH_BASE_URL}${endpoint}`
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...this.headers
        }
        const fetchOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        }
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions)
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Excel Online API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class ListWorksheetsTool extends BaseExcelOnlineTool {
    constructor(args) {
        const toolInput = {
            name: 'list_worksheets',
            description: 'List the worksheets in an Excel Online workbook',
            schema: ListWorksheetsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/me/drive/items/${params.itemId}/workbook/worksheets`
            const response = await this.makeExcelOnlineRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing worksheets: ${error}`, params)
        }
    }
}
class GetRangeTool extends BaseExcelOnlineTool {
    constructor(args) {
        const toolInput = {
            name: 'get_range',
            description: 'Get the values of a cell range in a worksheet',
            schema: GetRangeSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/me/drive/items/${params.itemId}/workbook/worksheets/${params.worksheetName}/range(address='${params.address}')`
            const response = await this.makeExcelOnlineRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting range: ${error}`, params)
        }
    }
}
class UpdateRangeTool extends BaseExcelOnlineTool {
    constructor(args) {
        const toolInput = {
            name: 'update_range',
            description: 'Update the values of a cell range in a worksheet',
            schema: UpdateRangeSchema,
            baseUrl: '',
            method: 'PATCH',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            let values
            try {
                values = JSON.parse(params.valuesJson)
            } catch (parseError) {
                throw new Error(`Invalid valuesJson: must be a JSON 2D array string, e.g. "[[1,2],[3,4]]" - ${parseError}`)
            }
            const endpoint = `/me/drive/items/${params.itemId}/workbook/worksheets/${params.worksheetName}/range(address='${params.address}')`
            const response = await this.makeExcelOnlineRequest({ endpoint, method: 'PATCH', body: { values }, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error updating range: ${error}`, params)
        }
    }
}
class AddTableRowTool extends BaseExcelOnlineTool {
    constructor(args) {
        const toolInput = {
            name: 'add_table_row',
            description: 'Add a row of values to an Excel table',
            schema: AddTableRowSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            let values
            try {
                values = JSON.parse(params.valuesJson)
            } catch (parseError) {
                throw new Error(`Invalid valuesJson: must be a JSON 2D array string, e.g. "[[1,2,3]]" - ${parseError}`)
            }
            const endpoint = `/me/drive/items/${params.itemId}/workbook/tables/${params.tableName}/rows/add`
            const response = await this.makeExcelOnlineRequest({ endpoint, method: 'POST', body: { values }, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error adding table row: ${error}`, params)
        }
    }
}
class ListTablesTool extends BaseExcelOnlineTool {
    constructor(args) {
        const toolInput = {
            name: 'list_tables',
            description: 'List the tables in an Excel Online workbook',
            schema: ListTablesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/me/drive/items/${params.itemId}/workbook/tables`
            const response = await this.makeExcelOnlineRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing tables: ${error}`, params)
        }
    }
}
const createExcelOnlineTools = (args) => {
    const tools = []
    const actions = args?.actions || []
    const accessToken = args?.accessToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}
    if (actions.includes('list_worksheets')) {
        tools.push(
            new ListWorksheetsTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('get_range')) {
        tools.push(
            new GetRangeTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('update_range')) {
        tools.push(
            new UpdateRangeTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('add_table_row')) {
        tools.push(
            new AddTableRowTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('list_tables')) {
        tools.push(
            new ListTablesTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    return tools
}
exports.createExcelOnlineTools = createExcelOnlineTools
//# sourceMappingURL=core.js.map
