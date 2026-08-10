import { lazy } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useConfig } from '@/store/context/ConfigContext'
import { useSelector } from 'react-redux'
import Loadable from '@/ui-component/loading/Loadable'

// Every view below is only ever rendered behind a permission/display check, but a plain
// static import loads its whole dependency tree unconditionally as part of this file's own
// chunk — and since DefaultRedirect sits in the router config (always eager), that dragged
// ~5.4MB of feature-specific weight (data grids, code/rich-text editors, math rendering,
// syntax highlighting) into every single page load, including the anonymous landing page.
// lazy() + Loadable matches the pattern every other route in this app already uses.
const Account = Loadable(lazy(() => import('@/views/account')))
const Executions = Loadable(lazy(() => import('@/views/agentexecutions')))
const Agentflows = Loadable(lazy(() => import('@/views/agentflows')))
const APIKey = Loadable(lazy(() => import('@/views/apikey')))
const Assistants = Loadable(lazy(() => import('@/views/assistants')))
const Login = Loadable(lazy(() => import('@/views/auth/login')))
const LoginActivityPage = Loadable(lazy(() => import('@/views/auth/loginActivity')))
const SSOConfig = Loadable(lazy(() => import('@/views/auth/ssoConfig')))
const Unauthorized = Loadable(lazy(() => import('@/views/auth/unauthorized')))
const Chatflows = Loadable(lazy(() => import('@/views/chatflows')))
const ControlTower = Loadable(lazy(() => import('@/views/controltower')))
const Credentials = Loadable(lazy(() => import('@/views/credentials')))
const EvalDatasets = Loadable(lazy(() => import('@/views/datasets')))
const Documents = Loadable(lazy(() => import('@/views/docstore')))
const EvalEvaluation = Loadable(lazy(() => import('@/views/evaluations/index')))
const Evaluators = Loadable(lazy(() => import('@/views/evaluators')))
const Marketplaces = Loadable(lazy(() => import('@/views/marketplaces')))
const RolesPage = Loadable(lazy(() => import('@/views/roles')))
const Tools = Loadable(lazy(() => import('@/views/tools')))
const UsersPage = Loadable(lazy(() => import('@/views/users')))
const Variables = Loadable(lazy(() => import('@/views/variables')))
const Workspaces = Loadable(lazy(() => import('@/views/workspace')))

/**
 * Component that redirects users to the first accessible page based on their permissions
 * Control Tower is the app's default landing page; this falls through to the first other
 * accessible page for users without executions:view, preventing 403s on the default route.
 */
export const DefaultRedirect = () => {
    const { hasPermission, hasDisplay } = useAuth()
    const { isOpenSource } = useConfig()
    const isGlobal = useSelector((state) => state.auth.isGlobal)
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

    // Define the order of routes to check (based on the menu order in dashboard.js)
    const routesToCheck = [
        { component: ControlTower, permission: 'executions:view' },
        { component: Chatflows, permission: 'chatflows:view' },
        { component: Agentflows, permission: 'agentflows:view' },
        { component: Executions, permission: 'executions:view' },
        { component: Assistants, permission: 'assistants:view' },
        { component: Marketplaces, permission: 'templates:marketplace,templates:custom' },
        { component: Tools, permission: 'tools:view' },
        { component: Credentials, permission: 'credentials:view' },
        { component: Variables, permission: 'variables:view' },
        { component: APIKey, permission: 'apikeys:view' },
        { component: Documents, permission: 'documentStores:view' },
        // Evaluation routes (with display flags)
        { component: EvalDatasets, permission: 'datasets:view', display: 'feat:datasets' },
        { component: Evaluators, permission: 'evaluators:view', display: 'feat:evaluators' },
        { component: EvalEvaluation, permission: 'evaluations:view', display: 'feat:evaluations' },
        // Management routes (with display flags)
        { component: SSOConfig, permission: 'sso:manage', display: 'feat:sso-config' },
        { component: RolesPage, permission: 'roles:manage', display: 'feat:roles' },
        { component: UsersPage, permission: 'users:manage', display: 'feat:users' },
        { component: Workspaces, permission: 'workspace:view', display: 'feat:workspaces' },
        { component: LoginActivityPage, permission: 'loginActivity:view', display: 'feat:login-activity' },
        // Other routes
        { component: Account, display: 'feat:account' }
    ]

    // If user is not authenticated, show login page
    if (!isAuthenticated) {
        return <Login />
    }

    // For open source, show Control Tower (no permission checks)
    if (isOpenSource) {
        return <ControlTower />
    }

    // For global admins, show Control Tower (they have access to everything)
    if (isGlobal) {
        return <ControlTower />
    }

    // Check each route in order and return the first accessible component
    for (const route of routesToCheck) {
        const { component: Component, permission, display } = route

        // Check permission if specified
        const hasRequiredPermission = !permission || hasPermission(permission)

        // Check display flag if specified
        const hasRequiredDisplay = !display || hasDisplay(display)

        // If user has both required permission and display access, return this component
        if (hasRequiredPermission && hasRequiredDisplay) {
            return <Component />
        }
    }

    // If no accessible routes found, show unauthorized page
    // This should rarely happen as most users should have at least one permission
    return <Unauthorized />
}
