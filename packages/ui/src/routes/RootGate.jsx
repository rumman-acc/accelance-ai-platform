import { lazy } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import MainLayout from '@/layout/MainLayout'
import Loadable from '@/ui-component/loading/Loadable'

const SignupLandingPage = Loadable(lazy(() => import('@/views/landing')))

// Anonymous visitors hitting the bare root ("/") see the marketing landing page instead of
// the app shell. Every other path under this route tree — and "/" itself once authenticated
// — is untouched: MainLayout + DefaultRedirect/RequireAuth behave exactly as before.
const RootGate = () => {
    const location = useLocation()
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

    if (location.pathname === '/' && !isAuthenticated) {
        return <SignupLandingPage />
    }

    return <MainLayout />
}

export default RootGate
