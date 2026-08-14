import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

// material-ui
import { Box, Button, Stack, Typography } from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import ErrorBoundary from '@/ErrorBoundary'
import AnalyticsConfigForm from '@/ui-component/extended/AnalyticsConfigForm'
import { BackdropLoader } from '@/ui-component/loading/BackdropLoader'

// API
import organizationApi from '@/api/organization'
import useApi from '@/hooks/useApi'

// utils
import useNotifier from '@/utils/useNotifier'
import { useError } from '@/store/context/ErrorContext'
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'
import { IconX } from '@tabler/icons-react'

// ==============================|| ORGANIZATION ANALYTICS ||============================== //
//
// Org-wide analytics-provider defaults. These apply to every agent in every workspace under
// this organization unless a workspace or agent-level override turns a provider off/on for
// itself — see mergeAnalyticsConfig (org -> workspace -> chatflow, most-specific wins per key).

const OrganizationAnalytics = () => {
    const dispatch = useDispatch()
    useNotifier()
    const { error, setError } = useError()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const currentUser = useSelector((state) => state.auth.user)

    const [analytic, setAnalytic] = useState({})
    const [saving, setSaving] = useState(false)

    const getOrganizationApi = useApi(organizationApi.getOrganizationById)

    useEffect(() => {
        if (currentUser?.activeOrganizationId) {
            getOrganizationApi.request(currentUser.activeOrganizationId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.activeOrganizationId])

    useEffect(() => {
        if (getOrganizationApi.data?.analytic) {
            try {
                setAnalytic(JSON.parse(getOrganizationApi.data.analytic))
            } catch (e) {
                setAnalytic({})
                console.error(e)
            }
        }
    }, [getOrganizationApi.data])

    useEffect(() => {
        if (getOrganizationApi.error) {
            setError(getOrganizationApi.error)
        }
    }, [getOrganizationApi.error, setError])

    const onSave = async () => {
        setSaving(true)
        try {
            const saveResp = await organizationApi.updateOrganizationAnalytic({ analytic: JSON.stringify(analytic) })
            if (saveResp.data) {
                enqueueSnackbar({
                    message: 'Organization Analytics Configuration Saved',
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success',
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
            }
        } catch (error) {
            enqueueSnackbar({
                message: `Failed to save Organization Analytics Configuration: ${
                    typeof error.response?.data === 'object' ? error.response.data.message : error.response?.data
                }`,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    persist: true,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <MainCard>
            {error ? (
                <ErrorBoundary error={error} />
            ) : (
                <Stack flexDirection='column' sx={{ gap: 3 }}>
                    <ViewHeader
                        isBackButton={false}
                        title='Organization Analytics'
                        description='Org-wide analytics-provider defaults. Apply to every agent in every workspace unless overridden at the workspace or agent level.'
                    />
                    <Box>
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                            Providers turned on here are the fallback for the whole organization. A workspace or an individual agent can
                            still turn a provider off, or on with different credentials — the most specific setting always wins.
                        </Typography>
                        <AnalyticsConfigForm value={analytic} onChange={setAnalytic} onSave={onSave} saving={saving} />
                    </Box>
                </Stack>
            )}
            {getOrganizationApi.loading && <BackdropLoader open={getOrganizationApi.loading} />}
        </MainCard>
    )
}

export default OrganizationAnalytics
