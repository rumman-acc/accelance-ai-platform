import { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

// material-ui
import {
    Typography,
    Box,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    ListItem,
    ListItemAvatar,
    ListItemText
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { IconX } from '@tabler/icons-react'

// project import
import CredentialInputHandler from '@/views/canvas/CredentialInputHandler'
import { TooltipWithParser } from '@/ui-component/tooltip/TooltipWithParser'
import { SwitchInput } from '@/ui-component/switch/Switch'
import { Input } from '@/ui-component/input/Input'
import { StyledButton } from '@/ui-component/button/StyledButton'
import { analyticProviders, getMissingRequiredInputs, validateAnalyticConfig } from '@/ui-component/extended/analyticProviders'

// store
import useNotifier from '@/utils/useNotifier'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

/**
 * Presentational analytics-provider accordion list, shared by every level of the cascade
 * (chatflow via AnalyseFlow, workspace, organization, and the bulk-apply dialog) so the provider
 * schema and accordion UI only live in one place. Purely controlled: `value`/`onChange` own the
 * `{ [providerName]: { status, credentialId, ... } }` object, this component has no fetch/save
 * logic of its own — callers decide what "save" means for their target.
 */
const AnalyticsConfigForm = ({ value, onChange, onSave, saveLabel = 'Save', saving = false }) => {
    const theme = useTheme()
    const dispatch = useDispatch()
    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [providerExpanded, setProviderExpanded] = useState({})

    const setValue = (newValue, providerName, inputParamName) => {
        const next = Object.prototype.hasOwnProperty.call(value, providerName) ? { ...value } : { ...value, [providerName]: {} }

        next[providerName] = { ...next[providerName], [inputParamName]: newValue }
        onChange(next)
    }

    const handleAccordionChange = (providerName) => (event, isExpanded) => {
        setProviderExpanded({ ...providerExpanded, [providerName]: isExpanded })
    }

    // A provider turned ON without its credential (or other required field, e.g. Opik's project
    // name) set would silently no-op at runtime — block the save and surface exactly which
    // provider(s) need it, instead of letting an incomplete config through.
    const handleSaveClick = () => {
        const incomplete = validateAnalyticConfig(value)
        if (incomplete.length > 0) {
            const expand = { ...providerExpanded }
            incomplete.forEach(({ provider }) => {
                expand[provider.name] = true
            })
            setProviderExpanded(expand)

            enqueueSnackbar({
                message: `Please add credentials for ${incomplete
                    .map(({ provider }) => provider.label)
                    .join(', ')} before saving — a provider can't be turned on without them.`,
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
            return
        }
        onSave()
    }

    return (
        <>
            {analyticProviders.map((provider, index) => {
                const missing = getMissingRequiredInputs(value[provider.name], provider)
                const missingNames = missing.map((input) => input.name)
                const isOn = value[provider.name] && value[provider.name].status
                const isIncomplete = isOn && missing.length > 0

                return (
                    <Accordion
                        expanded={providerExpanded[provider.name] || false}
                        onChange={handleAccordionChange(provider.name)}
                        disableGutters
                        key={index}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={provider.name} id={provider.name}>
                            <ListItem style={{ padding: 0, margin: 0 }} alignItems='center'>
                                <ListItemAvatar>
                                    <div
                                        style={{
                                            width: 50,
                                            height: 50,
                                            borderRadius: '50%',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <img
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                padding: 10,
                                                objectFit: 'contain'
                                            }}
                                            alt='AI'
                                            src={provider.icon}
                                        />
                                    </div>
                                </ListItemAvatar>
                                <ListItemText
                                    sx={{ ml: 1 }}
                                    primary={provider.label}
                                    secondary={
                                        <a
                                            target='_blank'
                                            rel='noreferrer'
                                            href={provider.url}
                                            style={{ color: theme.palette.primary.main, opacity: 0.85 }}
                                        >
                                            {provider.url}
                                        </a>
                                    }
                                />
                                {isOn && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignContent: 'center',
                                            alignItems: 'center',
                                            background: isIncomplete ? '#fde2e1' : '#d8f3dc',
                                            borderRadius: 15,
                                            padding: 5,
                                            paddingLeft: 7,
                                            paddingRight: 7,
                                            marginRight: 10
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 15,
                                                height: 15,
                                                borderRadius: '50%',
                                                backgroundColor: isIncomplete ? '#e63946' : '#70e000'
                                            }}
                                        />
                                        <span style={{ color: isIncomplete ? '#a4161a' : '#006400', marginLeft: 10 }}>
                                            {isIncomplete ? 'Incomplete' : 'ON'}
                                        </span>
                                    </div>
                                )}
                            </ListItem>
                        </AccordionSummary>
                        <AccordionDetails>
                            {provider.inputs.map((inputParam, index) => {
                                const isMissing = missingNames.includes(inputParam.name)
                                return (
                                    <Box key={index} sx={{ p: 2 }}>
                                        <div style={{ display: 'flex', flexDirection: 'row' }}>
                                            <Typography>
                                                {inputParam.label}
                                                {!inputParam.optional && <span style={{ color: 'red' }}>&nbsp;*</span>}
                                                {inputParam.description && (
                                                    <TooltipWithParser style={{ marginLeft: 10 }} title={inputParam.description} />
                                                )}
                                            </Typography>
                                        </div>
                                        {providerExpanded[provider.name] && inputParam.type === 'credential' && (
                                            <CredentialInputHandler
                                                data={value[provider.name] ? { credential: value[provider.name].credentialId } : {}}
                                                inputParam={inputParam}
                                                onSelect={(newValue) => setValue(newValue, provider.name, 'credentialId')}
                                            />
                                        )}
                                        {providerExpanded[provider.name] && inputParam.type === 'boolean' && (
                                            <SwitchInput
                                                onChange={(newValue) => setValue(newValue, provider.name, inputParam.name)}
                                                value={
                                                    value[provider.name]
                                                        ? value[provider.name][inputParam.name]
                                                        : inputParam.default ?? false
                                                }
                                            />
                                        )}
                                        {providerExpanded[provider.name] &&
                                            (inputParam.type === 'string' ||
                                                inputParam.type === 'password' ||
                                                inputParam.type === 'number') && (
                                                <Input
                                                    inputParam={inputParam}
                                                    onChange={(newValue) => setValue(newValue, provider.name, inputParam.name)}
                                                    value={
                                                        value[provider.name]
                                                            ? value[provider.name][inputParam.name]
                                                            : inputParam.default ?? ''
                                                    }
                                                />
                                            )}
                                        {providerExpanded[provider.name] && isMissing && (
                                            <Typography variant='caption' sx={{ color: 'error.main', mt: 0.5, display: 'block' }}>
                                                Required — {provider.label} is turned on but has no {inputParam.label.toLowerCase()} set.
                                            </Typography>
                                        )}
                                    </Box>
                                )
                            })}
                        </AccordionDetails>
                    </Accordion>
                )
            })}
            {onSave && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mt: 2 }}>
                    <StyledButton variant='contained' onClick={handleSaveClick} disabled={saving} sx={{ minWidth: 100 }}>
                        {saveLabel}
                    </StyledButton>
                </Box>
            )}
        </>
    )
}

AnalyticsConfigForm.propTypes = {
    value: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    onSave: PropTypes.func,
    saveLabel: PropTypes.string,
    saving: PropTypes.bool
}

export default AnalyticsConfigForm

// re-exported for callers that only need the schema/icons (e.g. a summary chip of enabled providers)
export { analyticProviders }
