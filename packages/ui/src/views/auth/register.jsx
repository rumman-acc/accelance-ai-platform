import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod/v3'

// material-ui
import { Alert, Box, Button, Divider, Icon, List, ListItemText, OutlinedInput, Stack, Typography, useTheme } from '@mui/material'

// project imports
import { StyledButton } from '@/ui-component/button/StyledButton'
import { Input } from '@/ui-component/input/Input'
import { BackdropLoader } from '@/ui-component/loading/BackdropLoader'
import AuthSplitShell from '@/ui-component/auth/AuthSplitShell'
import PasswordStrengthBar from '@/ui-component/auth/PasswordStrengthBar'

// API
import accountApi from '@/api/account.api'
import loginMethodApi from '@/api/loginMethod'
import ssoApi from '@/api/sso'

// Hooks
import useApi from '@/hooks/useApi'
import { useConfig } from '@/store/context/ConfigContext'
import { useError } from '@/store/context/ErrorContext'

// utils
import useNotifier from '@/utils/useNotifier'
import { passwordSchema } from '@/utils/validation'

// Icons
import Auth0SSOLoginIcon from '@/assets/images/auth0.svg'
import GithubSSOLoginIcon from '@/assets/images/github.svg'
import GoogleSSOLoginIcon from '@/assets/images/google.svg'
import AzureSSOLoginIcon from '@/assets/images/microsoft-azure.svg'
import { store } from '@/store'
import { loginSuccess } from '@/store/reducers/authSlice'
import { IconCircleCheck, IconExclamationCircle } from '@tabler/icons-react'

// ==============================|| Register ||============================== //

// IMPORTANT: when updating this schema, update the schema on the server as well
// packages/server/src/enterprise/Interface.Enterprise.ts
const RegisterEnterpriseUserSchema = z
    .object({
        username: z.string().min(1, 'Name is required'),
        email: z.string().min(1, 'Email is required').email('Invalid email address'),
        password: passwordSchema,
        confirmPassword: z.string().min(1, 'Confirm Password is required'),
        token: z.string().min(1, 'Invite Code is required')
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword']
    })

const RegisterCloudUserSchema = z
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

const REGISTER_PANEL_FEATURES = [
    'Three orchestration engines — agentflows, supervisor/worker, sequential',
    '29 model providers, 16 vector stores, MCP tool servers',
    'Workspaces, custom roles and an approval checkpoint on every flow'
]

const RegisterPage = () => {
    const theme = useTheme()
    useNotifier()
    const { isEnterpriseLicensed, isCloud, isOpenSource } = useConfig()

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
        placeholder: '********'
    }

    const confirmPasswordInput = {
        label: 'Confirm Password',
        name: 'confirmPassword',
        type: 'password',
        placeholder: '********'
    }

    const emailInput = {
        label: 'EMail',
        name: 'email',
        type: 'email',
        placeholder: 'user@company.com'
    }

    const inviteCodeInput = {
        label: 'Invite Code',
        name: 'inviteCode',
        type: 'text'
    }

    const [params] = useSearchParams()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [token, setToken] = useState(params.get('token') ?? '')
    const [username, setUsername] = useState('')
    const [configuredSsoProviders, setConfiguredSsoProviders] = useState([])

    const [loading, setLoading] = useState(false)
    const [authError, setAuthError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')

    const { authRateLimitError, setAuthRateLimitError } = useError()

    const registerApi = useApi(accountApi.registerAccount)
    const ssoLoginApi = useApi(ssoApi.ssoLogin)
    const getDefaultProvidersApi = useApi(loginMethodApi.getDefaultLoginMethods)
    const navigate = useNavigate()

    const register = async (event) => {
        event.preventDefault()
        setAuthRateLimitError(null)
        if (isEnterpriseLicensed) {
            const result = RegisterEnterpriseUserSchema.safeParse({
                username,
                email,
                token,
                password,
                confirmPassword
            })
            if (result.success) {
                setLoading(true)
                const body = {
                    user: {
                        name: username,
                        email,
                        credential: password,
                        tempToken: token
                    }
                }
                await registerApi.request(body)
            } else {
                const errorMessages = result.error.errors.map((err) => err.message)
                setAuthError(errorMessages.join(', '))
            }
        } else if (isCloud) {
            const formData = new FormData(event.target)
            const referral = formData.get('referral')
            const result = RegisterCloudUserSchema.safeParse({
                username,
                email,
                password,
                confirmPassword
            })
            if (result.success) {
                setLoading(true)
                const body = {
                    user: {
                        name: username,
                        email,
                        credential: password
                    }
                }
                if (referral) {
                    body.user.referral = referral
                }
                await registerApi.request(body)
            } else {
                const errorMessages = result.error.errors.map((err) => err.message)
                setAuthError(errorMessages.join(', '))
            }
        }
    }

    const signInWithSSO = (ssoProvider) => {
        //ssoLoginApi.request(ssoProvider)
        window.location.href = `/api/v1/${ssoProvider}/login`
    }

    useEffect(() => {
        if (registerApi.error) {
            if (isEnterpriseLicensed) {
                setAuthError(
                    `Error in registering user. Please contact your administrator. (${registerApi.error?.response?.data?.message})`
                )
            } else if (isCloud) {
                setAuthError(`Error in registering user. Please try again.`)
            }
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [registerApi.error])

    useEffect(() => {
        setAuthRateLimitError(null)
        if (!isOpenSource) {
            getDefaultProvidersApi.request()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (ssoLoginApi.data) {
            store.dispatch(loginSuccess(ssoLoginApi.data))
            navigate(location.state?.path || '/')
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ssoLoginApi.data])

    useEffect(() => {
        if (ssoLoginApi.error) {
            if (ssoLoginApi.error?.response?.status === 401 && ssoLoginApi.error?.response?.data.redirectUrl) {
                window.location.href = ssoLoginApi.error.response.data.redirectUrl
            } else {
                setAuthError(ssoLoginApi.error.message)
            }
        }
    }, [ssoLoginApi.error])

    useEffect(() => {
        if (getDefaultProvidersApi.data && getDefaultProvidersApi.data.providers) {
            //data is an array of objects, store only the provider attribute
            setConfiguredSsoProviders(getDefaultProvidersApi.data.providers.map((provider) => provider))
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getDefaultProvidersApi.data])

    useEffect(() => {
        if (registerApi.data) {
            setLoading(false)
            setAuthError(undefined)
            setConfirmPassword('')
            setPassword('')
            setToken('')
            setUsername('')
            setEmail('')
            if (isEnterpriseLicensed) {
                setSuccessMsg('Registration Successful. You will be redirected to the sign in page shortly.')
            } else if (isCloud) {
                setSuccessMsg('To complete your registration, please click on the verification link we sent to your email address')
            }
            setTimeout(() => {
                navigate('/signin')
            }, 3000)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [registerApi.data])

    return (
        <>
            <AuthSplitShell
                headline='Bring an agentic layer to the tools you already run.'
                subtitle='No rip-and-replace — connect what you have and start automating in minutes.'
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
                            {REGISTER_PANEL_FEATURES.map((feature) => (
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
                {authRateLimitError && (
                    <Alert icon={<IconExclamationCircle />} variant='filled' severity='error'>
                        {authRateLimitError}
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
                        {isEnterpriseLicensed ? 'Accept invite' : 'Get started'}
                    </Typography>
                    <Typography sx={{ fontSize: '32px', lineHeight: 1.25, fontWeight: 500, color: theme.palette.primary.dark }}>
                        {isEnterpriseLicensed ? 'Set up your account' : 'Create your account'}
                    </Typography>
                    <Typography variant='body2' sx={{ color: theme.palette.grey[600] }}>
                        Already have an account?{' '}
                        <Link style={{ color: theme.palette.primary.main }} to='/signin'>
                            {isEnterpriseLicensed ? 'Sign in instead' : 'Sign In'}
                        </Link>
                        .
                    </Typography>
                </Stack>
                <form onSubmit={register} data-rewardful>
                    <Stack sx={{ width: '100%', gap: 3 }}>
                        <Box>
                            <Typography sx={{ mb: 1 }}>
                                Full name<span style={{ color: theme.palette.error.main }}>&nbsp;*</span>
                            </Typography>
                            <Input
                                inputParam={usernameInput}
                                placeholder='Display Name'
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
                            <Input inputParam={emailInput} onChange={(newValue) => setEmail(newValue)} value={email} showDialog={false} />
                            <Typography variant='caption' sx={{ color: theme.palette.grey[600] }}>
                                This becomes your login. Kindly use a valid email address.
                            </Typography>
                        </Box>
                        {isEnterpriseLicensed && (
                            <Box>
                                <Typography sx={{ mb: 1 }}>
                                    Invite code<span style={{ color: theme.palette.error.main }}>&nbsp;*</span>
                                </Typography>
                                <OutlinedInput
                                    fullWidth
                                    type='string'
                                    placeholder='Paste in the invite code.'
                                    multiline={false}
                                    inputParam={inviteCodeInput}
                                    onChange={(e) => setToken(e.target.value)}
                                    value={token}
                                    sx={{
                                        fontFamily: 'ui-monospace, Menlo, monospace',
                                        letterSpacing: '0.06em',
                                        borderRadius: '12px'
                                    }}
                                />
                                <Typography variant='caption' sx={{ color: theme.palette.grey[600] }}>
                                    Please copy the token you would have received in your email.
                                </Typography>
                            </Box>
                        )}
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
                        </Box>
                        <Stack sx={{ gap: 2 }}>
                            <StyledButton fullWidth variant='contained' style={{ height: 52, borderRadius: 12 }} type='submit'>
                                {isEnterpriseLicensed ? 'Join organisation' : 'Create Account'}
                            </StyledButton>
                            {isEnterpriseLicensed && (
                                <Typography variant='caption' sx={{ color: theme.palette.grey[600], textAlign: 'center' }}>
                                    By joining you agree to your organisation&apos;s usage and data-retention policies.
                                </Typography>
                            )}
                        </Stack>
                        {configuredSsoProviders.length > 0 && (
                            <Divider sx={{ width: '100%' }}>
                                <Typography
                                    variant='caption'
                                    sx={{ letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.palette.grey[600] }}
                                >
                                    Or continue with
                                </Typography>
                            </Divider>
                        )}
                        {configuredSsoProviders.length > 0 && (
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                {configuredSsoProviders.map(
                                    (ssoProvider) =>
                                        //https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps
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
                                {configuredSsoProviders.map(
                                    (ssoProvider) =>
                                        ssoProvider === 'github' && (
                                            <Button
                                                key={ssoProvider}
                                                variant='outlined'
                                                style={{ height: 48, borderRadius: 12 }}
                                                onClick={() => signInWithSSO(ssoProvider)}
                                                startIcon={
                                                    <Icon>
                                                        <img src={GithubSSOLoginIcon} alt={'GithubSSO'} width={20} height={20} />
                                                    </Icon>
                                                }
                                            >
                                                GitHub
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

export default RegisterPage
