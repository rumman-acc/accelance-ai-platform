import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod/v3'

// material-ui
import { Alert, Box, Button, Chip, Divider, Icon, List, ListItemText, Stack, Typography, useTheme } from '@mui/material'

// project imports
import { StyledButton } from '@/ui-component/button/StyledButton'
import { Input } from '@/ui-component/input/Input'
import { BackdropLoader } from '@/ui-component/loading/BackdropLoader'
import AuthSplitShell from '@/ui-component/auth/AuthSplitShell'
import PasswordStrengthBar from '@/ui-component/auth/PasswordStrengthBar'

// API
import accountApi from '@/api/account.api'
import authApi from '@/api/auth'
import loginMethodApi from '@/api/loginMethod'

// Hooks
import useApi from '@/hooks/useApi'
import { store } from '@/store'
import { loginSuccess } from '@/store/reducers/authSlice'

// utils
import useNotifier from '@/utils/useNotifier'
import { passwordSchema } from '@/utils/validation'

// Icons
import Auth0SSOLoginIcon from '@/assets/images/auth0.svg'
import GoogleSSOLoginIcon from '@/assets/images/google.svg'
import AzureSSOLoginIcon from '@/assets/images/microsoft-azure.svg'
import { useConfig } from '@/store/context/ConfigContext'
import { IconCircleCheck, IconExclamationCircle } from '@tabler/icons-react'

// ==============================|| Organization & Admin User Setup ||============================== //

// IMPORTANT: when updating this schema, update the schema on the server as well
// packages/server/src/enterprise/Interface.Enterprise.ts
const OrgSetupSchema = z
    .object({
        username: z.string().min(1, 'Name is required'),
        email: z.string().min(1, 'Email is required').email('Invalid email address'),
        password: passwordSchema,
        confirmPassword: z.string().min(1, 'Confirm Password is required')
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword']
    })

const DAY_ONE_FEATURES = [
    'Three orchestration engines — agentflows, supervisor/worker, sequential',
    '29 model providers, 16 vector stores, MCP tool servers',
    'Workspaces, custom roles and an approval checkpoint on every flow'
]

const OrganizationSetupPage = () => {
    const theme = useTheme()
    useNotifier()
    const { isEnterpriseLicensed, isOpenSource } = useConfig()

    const orgNameInput = {
        label: 'Organization',
        name: 'organization',
        type: 'text',
        placeholder: 'Acme'
    }

    const usernameInput = {
        label: 'Username',
        name: 'username',
        type: 'text',
        placeholder: 'John Doe'
    }

    const passwordInput = {
        label: 'Password',
        name: 'password',
        type: 'password',
        placeholder: '********',
        enablePasswordToggle: true
    }

    const confirmPasswordInput = {
        label: 'Confirm Password',
        name: 'confirmPassword',
        type: 'password',
        placeholder: '********',
        enablePasswordToggle: true
    }

    const emailInput = {
        label: 'EMail',
        name: 'email',
        type: 'email',
        placeholder: 'user@company.com'
    }

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [username, setUsername] = useState('')
    const location = useLocation()
    const [orgName, setOrgName] = useState(location.state?.orgName || '')
    // Display-only preview of the slug the server will generate — never submitted as-is,
    // sanitizeRegistrationDTO strips any client-provided slug regardless.
    const orgSlugPreview = orgName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

    const [loading, setLoading] = useState(false)
    const [authError, setAuthError] = useState('')
    const [successMsg, setSuccessMsg] = useState(undefined)

    const loginApi = useApi(authApi.login)
    const registerAccountApi = useApi(accountApi.registerAccount)
    const navigate = useNavigate()

    const getDefaultProvidersApi = useApi(loginMethodApi.getDefaultLoginMethods)
    const [configuredSsoProviders, setConfiguredSsoProviders] = useState([])

    const register = async (event) => {
        event.preventDefault()
        const result = OrgSetupSchema.safeParse({
            orgName,
            username,
            email,
            password,
            confirmPassword
        })
        if (result.success) {
            setLoading(true)
            setAuthError('')

            // Proceed with registration after successful authentication
            const body = {
                user: {
                    name: username,
                    email: email,
                    credential: password
                }
            }
            if (isEnterpriseLicensed) {
                body.organization = {
                    name: orgName
                }
            }
            await registerAccountApi.request(body)
        } else {
            // Handle validation errors
            const errorMessages = result.error.errors.map((error) => error.message)
            setAuthError(errorMessages.join(', '))
        }
    }

    useEffect(() => {
        if (registerAccountApi.error) {
            const errMessage =
                typeof registerAccountApi.error.response.data === 'object'
                    ? registerAccountApi.error.response.data.message
                    : registerAccountApi.error.response.data
            let finalErrMessage = ''
            if (isEnterpriseLicensed) {
                finalErrMessage = `Error in registering organization. Please contact your administrator. (${errMessage})`
            } else {
                finalErrMessage = `Error in registering account: ${errMessage}`
            }
            setAuthError(finalErrMessage)
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [registerAccountApi.error])

    useEffect(() => {
        if (!isOpenSource) {
            getDefaultProvidersApi.request()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getDefaultProvidersApi.data && getDefaultProvidersApi.data.providers) {
            setConfiguredSsoProviders(getDefaultProvidersApi.data.providers.map((provider) => provider))
        }
    }, [getDefaultProvidersApi.data])

    useEffect(() => {
        if (registerAccountApi.data) {
            setAuthError(undefined)
            setConfirmPassword('')
            setPassword('')
            setUsername('')
            setEmail('')
            // Matches the backend's UserStatus.UNVERIFIED value. Enterprise org creation now
            // requires email verification when SMTP is configured (Open Source stays instant-active,
            // untouched) — an unverified account can't log in yet, so don't attempt the auto-login
            // below or it'll silently fail against the USER_EMAIL_UNVERIFIED check.
            if (registerAccountApi.data.user?.status === 'unverified') {
                setLoading(false)
                setSuccessMsg('To complete your registration, please click the verification link we sent to your email address.')
                return
            }
            setSuccessMsg(registerAccountApi.data.message)
            setTimeout(() => {
                const body = {
                    email,
                    password
                }
                loginApi.request(body)
            }, 1000)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [registerAccountApi.data])

    useEffect(() => {
        if (loginApi.data) {
            setLoading(false)
            store.dispatch(loginSuccess(loginApi.data))
            localStorage.setItem('username', loginApi.data.name)
            navigate(location.state?.path || '/')
            //navigate(0)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginApi.data])

    useEffect(() => {
        if (loginApi.error) {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginApi.error])

    const signInWithSSO = (ssoProvider) => {
        window.location.href = `/api/v1/${ssoProvider}/login`
    }

    return (
        <>
            <AuthSplitShell
                headline="Your systems aren't outdated. They're just missing agents."
                subtitle='An agentic layer over the ERP, CRM and internal apps you already run — no rip-and-replace.'
                panelExtra={
                    <>
                        <Typography
                            sx={{
                                fontSize: '12px',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: '#C7E0FF',
                                fontWeight: 500
                            }}
                        >
                            What you get on day one
                        </Typography>
                        <Stack sx={{ gap: 1.5 }}>
                            {DAY_ONE_FEATURES.map((feature) => (
                                <Stack key={feature} direction='row' sx={{ gap: 1.5, alignItems: 'baseline' }}>
                                    <Box
                                        sx={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '3px',
                                            background: theme.palette.secondary.main,
                                            flexShrink: 0
                                        }}
                                    />
                                    <Typography sx={{ fontSize: '15px', lineHeight: 1.5, fontWeight: 300, color: '#fff' }}>
                                        {feature}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </>
                }
            >
                {authError && (
                    <Alert icon={<IconExclamationCircle />} variant='filled' severity='error'>
                        {authError.split(', ').length > 0 ? (
                            <List dense sx={{ py: 0 }}>
                                {authError.split(', ').map((error, index) => (
                                    <ListItemText key={index} primary={error} primaryTypographyProps={{ color: '#fff !important' }} />
                                ))}
                            </List>
                        ) : (
                            authError
                        )}
                    </Alert>
                )}
                {successMsg && (
                    <Alert icon={<IconCircleCheck />} variant='filled' severity='success'>
                        {successMsg}
                    </Alert>
                )}
                <Stack sx={{ gap: 2 }}>
                    <Typography
                        sx={{
                            fontSize: '12px',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: theme.palette.primary.main,
                            fontWeight: 500
                        }}
                    >
                        Get started
                    </Typography>
                    <Typography sx={{ fontSize: '32px', lineHeight: 1.25, fontWeight: 500, color: theme.palette.primary.dark }}>
                        {isEnterpriseLicensed ? 'Create your organisation' : 'Create your account'}
                    </Typography>
                    {isOpenSource && (
                        <Typography variant='body2' sx={{ color: theme.palette.grey[600] }}>
                            Account setup does not make any external connections, your data stays securely on your locally hosted server.
                        </Typography>
                    )}
                    {isEnterpriseLicensed && (
                        <Typography variant='body2' sx={{ color: theme.palette.grey[600] }}>
                            Takes a minute. You&apos;ll be the first administrator — invite the rest of your team once you&apos;re in. You
                            may be asked to verify your email address before you can sign in, depending on how this deployment is
                            configured.
                        </Typography>
                    )}
                </Stack>
                <form onSubmit={register}>
                    <Stack sx={{ width: '100%', gap: 3 }}>
                        {isEnterpriseLicensed && (
                            <>
                                <Box>
                                    <Typography sx={{ mb: 1 }}>
                                        Organisation name<span style={{ color: theme.palette.error.main }}>&nbsp;*</span>
                                    </Typography>
                                    <Input
                                        inputParam={orgNameInput}
                                        placeholder='Acme Industries'
                                        onChange={(newValue) => setOrgName(newValue)}
                                        value={orgName}
                                        showDialog={false}
                                    />
                                    {orgSlugPreview && (
                                        <Typography variant='caption' sx={{ color: theme.palette.grey[600] }}>
                                            Your sign-in address will be{' '}
                                            <span
                                                style={{ fontFamily: 'ui-monospace, Menlo, monospace', color: theme.palette.primary.main }}
                                            >
                                                /o/{orgSlugPreview}
                                            </span>
                                        </Typography>
                                    )}
                                </Box>
                                <Divider>
                                    <Chip label='Account Administrator' size='small' />
                                </Divider>
                            </>
                        )}
                        <Box>
                            <Typography sx={{ mb: 1 }}>
                                Full name<span style={{ color: theme.palette.error.main }}>&nbsp;*</span>
                            </Typography>
                            <Input
                                inputParam={usernameInput}
                                placeholder='Priya Raman'
                                onChange={(newValue) => setUsername(newValue)}
                                value={username}
                                showDialog={false}
                            />
                            <Typography variant='caption' sx={{ color: theme.palette.grey[600] }}>
                                Is used for display purposes only.
                            </Typography>
                        </Box>
                        <Box>
                            <Typography sx={{ mb: 1 }}>
                                Work email<span style={{ color: theme.palette.error.main }}>&nbsp;*</span>
                            </Typography>
                            <Input
                                inputParam={emailInput}
                                onChange={(newValue) => setEmail(newValue)}
                                type='email'
                                value={email}
                                showDialog={false}
                            />
                            <Typography variant='caption' sx={{ color: theme.palette.grey[600] }}>
                                This becomes your login. Kindly use a valid email address.
                            </Typography>
                        </Box>
                        <Box>
                            <Typography sx={{ mb: 1 }}>
                                Password<span style={{ color: theme.palette.error.main }}>&nbsp;*</span>
                            </Typography>
                            <Input inputParam={passwordInput} onChange={(newValue) => setPassword(newValue)} value={password} />
                            <PasswordStrengthBar password={password} />
                            <Typography variant='caption' sx={{ color: theme.palette.grey[600] }}>
                                At least 8 characters, with an uppercase letter, a digit and a symbol.
                            </Typography>
                        </Box>
                        <Box>
                            <Typography sx={{ mb: 1 }}>
                                Confirm password<span style={{ color: theme.palette.error.main }}>&nbsp;*</span>
                            </Typography>
                            <Input
                                inputParam={confirmPasswordInput}
                                onChange={(newValue) => setConfirmPassword(newValue)}
                                value={confirmPassword}
                            />
                            {confirmPassword && password !== confirmPassword && (
                                <Typography variant='caption' sx={{ color: theme.palette.error.main }}>
                                    Passwords don&apos;t match
                                </Typography>
                            )}
                        </Box>
                        <Stack sx={{ gap: 2 }}>
                            <StyledButton
                                fullWidth
                                variant='contained'
                                style={{ height: 52, borderRadius: 12 }}
                                type='submit'
                                disabled={!!confirmPassword && password !== confirmPassword}
                            >
                                {isEnterpriseLicensed ? 'Create organisation' : 'Sign Up'}
                            </StyledButton>
                            <Typography variant='body2' sx={{ color: theme.palette.grey[600], textAlign: 'center' }}>
                                Already set up?{' '}
                                <Link style={{ color: theme.palette.primary.main }} to='/signin'>
                                    Sign in
                                </Link>
                            </Typography>
                        </Stack>
                        {configuredSsoProviders && configuredSsoProviders.length > 0 && (
                            <Divider sx={{ width: '100%' }}>
                                <Typography
                                    variant='caption'
                                    sx={{ letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.palette.grey[600] }}
                                >
                                    Or continue with
                                </Typography>
                            </Divider>
                        )}
                        {configuredSsoProviders && configuredSsoProviders.length > 0 && (
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                {configuredSsoProviders.map(
                                    (ssoProvider) =>
                                        ssoProvider === 'azure' && (
                                            <Button
                                                key={ssoProvider}
                                                variant='outlined'
                                                style={{ height: 48, borderRadius: 12 }}
                                                onClick={() => signInWithSSO(ssoProvider)}
                                                startIcon={
                                                    <Icon>
                                                        <img src={AzureSSOLoginIcon} alt={'MicrosoftSSO'} width={20} height={20} />
                                                    </Icon>
                                                }
                                            >
                                                Microsoft
                                            </Button>
                                        )
                                )}
                                {configuredSsoProviders.map(
                                    (ssoProvider) =>
                                        ssoProvider === 'google' && (
                                            <Button
                                                key={ssoProvider}
                                                variant='outlined'
                                                style={{ height: 48, borderRadius: 12 }}
                                                onClick={() => signInWithSSO(ssoProvider)}
                                                startIcon={
                                                    <Icon>
                                                        <img src={GoogleSSOLoginIcon} alt={'GoogleSSO'} width={20} height={20} />
                                                    </Icon>
                                                }
                                            >
                                                Google
                                            </Button>
                                        )
                                )}
                                {configuredSsoProviders.map(
                                    (ssoProvider) =>
                                        ssoProvider === 'auth0' && (
                                            <Button
                                                key={ssoProvider}
                                                variant='outlined'
                                                style={{ height: 48, borderRadius: 12 }}
                                                onClick={() => signInWithSSO(ssoProvider)}
                                                startIcon={
                                                    <Icon>
                                                        <img src={Auth0SSOLoginIcon} alt={'Auth0SSO'} width={20} height={20} />
                                                    </Icon>
                                                }
                                            >
                                                Auth0
                                            </Button>
                                        )
                                )}
                            </Box>
                        )}
                    </Stack>
                </form>
            </AuthSplitShell>
            {loading && <BackdropLoader open={loading} />}
        </>
    )
}

export default OrganizationSetupPage
