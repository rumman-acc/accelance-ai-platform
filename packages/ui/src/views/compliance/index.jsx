import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

// material-ui
import { Button, Stack, Typography, CircularProgress, Box } from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import GuardrailRow from '@/ui-component/extended/GuardrailRow'
import { useAuth } from '@/hooks/useAuth'

// API
import guardrailsApi from '@/api/guardrails'
import auditLogApi from '@/api/auditLog'

// utils
import useNotifier from '@/utils/useNotifier'

const WORKSPACE_WIDE = ''

/**
 * The one item in this section that's genuinely not a coding task -- an external audit +
 * legal process, not something to build. Left as a static placeholder on purpose (2026-08-17
 * decision), unlike the other three, which are now real, toggleable catalog entries below.
 */
const STATIC_NOT_BUILT_ITEMS = [
    {
        key: 'certifications',
        name: 'Compliance Certifications & Data Residency',
        description: 'Formal SOC2 / GDPR / HIPAA certifications and data-residency guarantees some enterprise buyers require.'
    }
]

/**
 * Reference-only: frameworks worth mapping to once compliance work starts, not features to build.
 * No enforcement, no certification claim implied -- just naming what "compliant" would mean here.
 */
const FRAMEWORK_REFERENCES = [
    {
        key: 'nist_ai_rmf',
        name: 'NIST AI RMF (+ Generative AI Profile)',
        description: 'Voluntary US risk-management framework — the most common thing enterprise buyers ask to map to.'
    },
    {
        key: 'iso_42001',
        name: 'ISO/IEC 42001',
        description: 'AI management system standard — actually certifiable, so it shows up in procurement.'
    },
    {
        key: 'eu_ai_act',
        name: 'EU AI Act',
        description: 'Risk-tier obligations and Article 50 transparency duties (disclosing users are talking to AI).'
    },
    {
        key: 'owasp_llm_top10',
        name: 'OWASP Top 10 for LLM Applications',
        description:
            'Security threat taxonomy (prompt injection, insecure output handling, excessive agency) — the closest thing to a de facto standard for the Guardrails side of this platform.'
    }
]

const buildRows = (catalog, policies) => {
    return catalog
        .filter((item) => item.category === 'compliance')
        .map((item) => {
            const workspaceRow = policies.find((p) => p.catalogKey === item.key && p.chatflowId === WORKSPACE_WIDE)
            return {
                catalogKey: item.key,
                name: item.name,
                description: item.description,
                kind: item.kind,
                enforcementStatus: item.enforcementStatus,
                active: !!workspaceRow?.enabled
            }
        })
}

const CompliancePage = () => {
    const dispatch = useDispatch()
    const { hasPermission } = useAuth()
    const canManage = hasPermission('guardrails:manage')
    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [rows, setRows] = useState(null)
    const [loading, setLoading] = useState(false)
    const [auditLog, setAuditLog] = useState(null)

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

    const load = async () => {
        setLoading(true)
        try {
            const [catalogRes, policiesRes] = await Promise.all([guardrailsApi.getCatalog(), guardrailsApi.getPolicies()])
            const builtRows = buildRows(catalogRes.data, policiesRes.data)
            setRows(builtRows)

            const auditRow = builtRows.find((r) => r.catalogKey === 'audit_log')
            if (auditRow?.active) {
                const auditRes = await auditLogApi.getAuditLog(20)
                setAuditLog(auditRes.data)
            } else {
                setAuditLog(null)
            }
        } catch (err) {
            showError(err?.response?.data?.message || 'Failed to load Compliance catalog')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onToggle = async (catalogKey, enabled) => {
        try {
            await guardrailsApi.upsertPolicy({ catalogKey, enabled })
            await load()
        } catch (err) {
            showError(err?.response?.data?.message || 'Failed to update')
        }
    }

    return (
        <MainCard>
            <Stack flexDirection='column' sx={{ gap: 3 }}>
                <ViewHeader
                    title='Compliance'
                    description='Organizational governance controls — audit trail, data retention, and platform-wide policy.'
                />

                {loading && !rows && <CircularProgress size={20} />}

                {rows && (
                    <Stack direction='column' spacing={1.5}>
                        {rows.map((item) => (
                            <GuardrailRow
                                key={item.catalogKey}
                                testId={`compliance-row-${item.catalogKey}`}
                                name={item.name}
                                description={item.description}
                                badges={[
                                    {
                                        label: item.active ? 'Enabled' : 'Disabled',
                                        bg: item.active ? 'rgba(22,163,74,0.1)' : 'rgba(158,158,158,0.15)',
                                        color: item.active ? '#16a34a' : 'text.secondary'
                                    }
                                ]}
                                showSwitch={canManage}
                                switchValue={item.active}
                                onToggle={(val) => onToggle(item.catalogKey, val)}
                            />
                        ))}
                        {STATIC_NOT_BUILT_ITEMS.map((item) => (
                            <GuardrailRow
                                key={item.key}
                                testId={`compliance-row-${item.key}`}
                                name={item.name}
                                description={item.description}
                                badges={[{ label: 'Not yet built', bg: 'rgba(158,158,158,0.15)', color: 'text.secondary' }]}
                                showSwitch={false}
                            />
                        ))}
                    </Stack>
                )}

                {auditLog?.enabled && (
                    <Stack direction='column' spacing={1}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Recent audit log entries</Typography>
                        {auditLog.rows.length === 0 ? (
                            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                No entries yet — actions taken from now on will appear here.
                            </Typography>
                        ) : (
                            <Box sx={{ borderRadius: '8px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                {auditLog.rows.map((row, idx) => (
                                    <Box
                                        key={row.id}
                                        sx={{
                                            px: 2,
                                            py: 1,
                                            borderTop: idx > 0 ? '1px solid' : 'none',
                                            borderColor: 'divider',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            gap: 2
                                        }}
                                    >
                                        <Typography sx={{ fontSize: '0.8rem' }}>
                                            <strong>{row.action}</strong> — {row.targetType}
                                            {row.targetId ? ` (${row.targetId.slice(0, 8)}…)` : ''}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', flexShrink: 0 }}>
                                            {new Date(row.createdDate).toLocaleString()}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Stack>
                )}

                <Stack direction='column' spacing={1}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Frameworks to map to</Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                        Reference only — named here so it&apos;s clear what &quot;compliant&quot; would mean once the items above are built
                        out further, not a certification claim.
                    </Typography>
                    <Stack direction='column' spacing={1.5} sx={{ mt: 1 }}>
                        {FRAMEWORK_REFERENCES.map((item) => (
                            <GuardrailRow
                                key={item.key}
                                testId={`framework-row-${item.key}`}
                                name={item.name}
                                description={item.description}
                                badges={[{ label: 'Reference', bg: 'rgba(33,150,243,0.1)', color: '#2196f3' }]}
                                showSwitch={false}
                            />
                        ))}
                    </Stack>
                </Stack>
            </Stack>
        </MainCard>
    )
}

export default CompliancePage
