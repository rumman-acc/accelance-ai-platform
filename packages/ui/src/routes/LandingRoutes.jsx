import { lazy } from 'react'

import Loadable from '@/ui-component/loading/Loadable'
import MinimalLayout from '@/layout/MinimalLayout'

const SignupLandingPage = Loadable(lazy(() => import('@/views/landing')))

// ==============================|| LANDING ROUTING ||============================== //

const LandingRoutes = {
    path: '/',
    element: <MinimalLayout />,
    children: [
        {
            path: '/get-started',
            element: <SignupLandingPage />
        }
    ]
}

export default LandingRoutes
