import express from 'express'
import mcpRegistryController from '../../controllers/mcp-registry'
import { checkPermission } from '../../enterprise/rbac/PermissionCheck'

const router = express.Router()

// SEARCH the public official MCP registry by keyword
router.get('/search', checkPermission('tools:view'), mcpRegistryController.searchServers)

// IMPORT a selected registry server as a CustomMcpServer row (same permission as any other tool-create action)
router.post('/import', checkPermission('tools:create'), mcpRegistryController.importServer)

export default router
