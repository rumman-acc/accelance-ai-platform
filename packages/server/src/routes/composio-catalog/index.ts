import express from 'express'
import composioCatalogController from '../../controllers/composio-catalog'
import { checkPermission } from '../../enterprise/rbac/PermissionCheck'

const router = express.Router()

// SEARCH the Composio action catalog by keyword
router.get('/search', checkPermission('tools:view'), composioCatalogController.searchActions)

// LIST existing connected accounts for a given app (read-only; connecting happens on app.composio.dev)
router.get('/connections', checkPermission('tools:view'), composioCatalogController.listConnections)

// IMPORT a selected action as a first-class Tool row
router.post('/import', checkPermission('tools:create'), composioCatalogController.importAction)

export default router
