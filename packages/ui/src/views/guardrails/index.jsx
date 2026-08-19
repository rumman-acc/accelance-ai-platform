import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

// material-ui
import { Button, Stack, Typography, CircularProgress, Box } from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ViewHeader from '@/layout/MainLayout/ViewHeader'

// API
import guardrailsApi from '@/api/guardrails'

// utils
import useNotifier from '@/utils/useNotifier'

const CATEGORY_LABELS = {
    safety: 'Safety',
    privacy: 'Privacy',
    security: 'Security',
    quality: 'Quality',
    compliance: 'Compliance'
}

/**
 * Guardrails v2 -- this page is now a read-only catalog browser, per build-plan §2.2: workspace
 * -wide defaults management, per-guardrail override counts, and the Content Moderation
 * auto-insert-on-new-agent behavior are all deleted, not deferred. Placing a guardrail on a
 * specific agent (and any per-agent override) happens from that agent's own canvas settings
 * panel -- see ui-component/extended/GuardrailsCompliance.jsx -- not from this page.
 */
const GuardrailsPage = () => {
    const dispatch = useDispatch()
    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [definitions, setDefinitions] = useState(null)
    const [loading, setLoading] = useState(false)

    const showError = (message) => {
        enqueueSnackbar({
            message,
            options: {
                key: new Date().getTime() + Math.random(),
                variant: 'error',
                persist: true,
                action: (key) => (
                    <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                        Dismiss
                    </Button>
                )
            }
        })
    }

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const res = await guardrailsApi.getCatalog()
                setDefinitions(res.data)
            } catch (err) {
                showError(err?.response?.data?.message || 'Failed to load the Guardrails catalog')
            } finally {
                setLoading(false)
            }
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const grouped = (definitions || []).reduce((acc, def) => {
        const category = def.category || 'safety'
        acc[category] = acc[category] || []
        acc[category].push(def)
        return acc
    }, {})

    return (
        <MainCard>
            <Stack flexDirection='column' sx={{ gap: 3 }}>
                <ViewHeader
                    title='Guardrails'
                    description="Browsable catalog of guardrails available to place on an agent's canvas. Attach one, and any per-agent override, from that agent's own settings panel."
                />

                {loading && !definitions && <CircularProgress size={20} />}

                {definitions &&
                    Object.keys(grouped)
                        .sort()
                        .map((category) => (
                            <Stack key={category} direction='column' spacing={1.5}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                    {CATEGORY_LABELS[category] || category}
                                </Typography>
                                <Stack direction='row' spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                                    {grouped[category].map((def) => (
                                        <Box
                                            key={def.key}
                                            data-testid={`guardrail-catalog-row-${def.key}`}
                                            sx={{
                                                flex: '1 1 320px',
                                                minWidth: 280,
                                                p: 2,
                                                borderRadius: '8px',
                                                border: '1px solid',
                                                borderColor: 'divider'
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{def.name}</Typography>
                                            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.5, lineHeight: 1.5 }}>
                                                {def.description}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Stack>
                        ))}
            </Stack>
        </MainCard>
    )
}

export default GuardrailsPage
