import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

// material-ui
import { Stack, useTheme, Typography, Box, Alert, Button, Divider, Icon } from '@mui/material'
import { IconExclamationCircle } from '@tabler/icons-react'
import { LoadingButton } from '@mui/lab'

// project imports
import { Input } from '@/ui-component/input/Input'
import AuthSplitShell from '@/ui-component/auth/AuthSplitShell'
import AuthCenteredShell from '@/ui-component/auth/AuthCenteredShell'
import Logo from '@/ui-component/extended/Logo'

// Hooks
import useApi from '@/hooks/useApi'
import { useConfig } from '@/store/context/ConfigContext'
import { useError } from '@/store/context/ErrorContext'

// API
import authApi from '@/api/auth'
import accountApi from '@/api/account.api'
import loginMethodApi from '@/api/loginMethod'
import ssoApi from '@/api/sso'

// utils
import useNotifier from '@/utils/useNotifier'

// store
import { loginSuccess, logoutSuccess } from '@/store/reducers/authSlice'
import { store } from '@/store'

// icons
import AzureSSOLoginIcon from '@/assets/images/microsoft-azure.svg'
import GoogleSSOLoginIcon from '@/assets/images/google.svg'
import Auth0SSOLoginIcon from '@/assets/images/auth0.svg'
import GithubSSOLoginIcon from '@/assets/images/github.svg'

// ==============================|| SignInPage ||============================== //

const GOVERNANCE_TIERS = [
    { label: 'AUTONOMOUS', description: 'Reads, drafts, enriches', bg: '#13BA2F', color: '#fff' },
    { label: 'REVIEW', description: 'Human reads before it moves on', bg: '#FFD166', color: '#3A2A00' },
    { label: 'APPROVAL', description: 'Nothing runs without a yes', bg: '#FFFFFF', color: '#062667' }
]

const SignInPage = () => {
    const theme = useTheme()
    useSelector((state) => state.customization)
    useNotifier()
    const { isEnterpriseLicensed, isCloud, isOpenSource } = useConfig()

    const usernameInput = {
        label: 'Username',
        name: 'username',
        type: 'email',
        placeholder: 'user@company.com'
    }
    const passwordInput = {
        label: 'Password',
        name: 'password',
        type: 'password',
        placeholder: '********',
        enablePasswordToggle: true
    }
    const [usernameVal, setUsernameVal] = useState('')
    const [passwordVal, setPasswordVal] = useState('')
    const [configuredSsoProviders, setConfiguredSsoProviders] = useState([])
    const [authError, setAuthError] = useState(undefined)
    const [loading, setLoading] = useState(false)
    const [showResendButton, setShowResendButton] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    const { authRateLimitError, setAuthRateLimitError } = useError()

    const loginApi = useApi(authApi.login)
    const ssoLoginApi = useApi(ssoApi.ssoLogin)
    const getDefaultProvidersApi = useApi(loginMethodApi.getDefaultLoginMethods)
    const navigate = useNavigate()
    const location = useLocation()
    const { slug: organizationSlug } = useParams()
    const resendVerificationApi = useApi(accountApi.resendVerificationEmail)
    // Display-only label derived from the URL slug — no extra API call for the org's real name.
    const orgDisplayName = organizationSlug
        ? organizationSlug
              .split('-')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
        : ''

    const doLogin = (event) => {
        event.preventDefault()
        setAuthRateLimitError(null)
        setLoading(true)
        const body = {
            email: usernameVal,
            password: passwordVal
        }
        loginApi.request(body)
    }

    useEffect(() => {
        if (loginApi.error) {
            setLoading(false)
            if (loginApi.error.response.status === 401 && loginApi.error.response.data.redirectUrl) {
                window.location.href = loginApi.error.response.data.data.redirectUrl
            } else {
                setAuthError(loginApi.error.response.data.message)
            }
        }
    }, [loginApi.error])

    useEffect(() => {
        store.dispatch(logoutSuccess())
        setAuthRateLimitError(null)
        if (!isOpenSource) {
            getDefaultProvidersApi.request(organizationSlug)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setAuthRateLimitError, isOpenSource, organizationSlug])

    useEffect(() => {
        // Parse the "user" query parameter from the URL
        const queryParams = new URLSearchParams(location.search)
        const errorData = queryParams.get('error')
        if (!errorData) return
        const parsedErrorData = JSON.parse(decodeURIComponent(errorData))
        setAuthError(parsedErrorData.message)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search])

    useEffect(() => {
        if (loginApi.data) {
            setLoading(false)
            store.dispatch(loginSuccess(loginApi.data))
            navigate(location.state?.path || '/')
            //navigate(0)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginApi.data])

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
        if (authError === 'User Email Unverified') {
            setShowResendButton(true)
        } else {
            setShowResendButton(false)
        }
    }, [authError])

    const signInWithSSO = (ssoProvider) => {
        window.location.href = organizationSlug ? `/api/v1/${ssoProvider}/${organizationSlug}/login` : `/api/v1/${ssoProvider}/login`
    }

    const handleResendVerification = async () => {
        try {
            await resendVerificationApi.request({ email: usernameVal })
            setAuthError(undefined)
            setSuccessMessage('Verification email has been sent successfully.')
            setShowResendButton(false)
        } catch (error) {
            setAuthError(error.response?.data?.message || 'Failed to send verification email.')
        }
    }

    const formBody = (
        <>
            {!organizationSlug && (
                <Box sx={{ alignSelf: 'center' }}>
                    <Logo variant='dark' size={30} />
                </Box>
            )}
            {successMessage && (
                <Alert variant='filled' severity='success' onClose={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            )}
            {authRateLimitError && (
                <Alert icon={<IconExclamationCircle />} variant='filled' severity='error'>
                    {authRateLimitError}
                </Alert>
            )}
            {authError && (
                <Alert icon={<IconExclamationCircle />} variant='filled' severity='error'>
                    {authError}
                </Alert>
            )}
            {showResendButton && (
                <Stack sx={{ gap: 1 }}>
                    <Button variant='text' onClick={handleResendVerification}>
                        Resend Verification Email
                    </Button>
                </Stack>
            )}
            <Stack sx={{ gap: 2, textAlign: organizationSlug ? 'left' : 'center' }}>
                {organizationSlug && (
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1.5,
                            alignSelf: 'flex-start',
                            py: 1,
                            px: 1,
                            pr: 1.5,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: '12px'
                        }}
                    >
                        <Box
                            sx={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                background: theme.palette.primary.light,
                                color: theme.palette.primary.main,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                        >
                            {orgDisplayName.charAt(0)}
                        </Box>
                        <Typography variant='body2'>{orgDisplayName}</Typography>
                        <Typography variant='caption' sx={{ fontFamily: 'ui-monospace, Menlo, monospace', color: theme.palette.grey[600] }}>
                            /{organizationSlug}
                        </Typography>
                    </Box>
                )}
                <Typography sx={{ fontSize: '32px', lineHeight: 1.25, fontWeight: 500, color: theme.palette.primary.dark }}>
                    {organizationSlug ? 'Sign in' : 'Welcome back'}
                </Typography>
                {!organizationSlug && (
                    <Typography variant='body2' sx={{ color: theme.palette.grey[600] }}>
                        Enter your email and we&apos;ll take you to your organisation.
                    </Typography>
                )}
                {isCloud && (
                    <Typography variant='body2' sx={{ color: theme.palette.grey[600] }}>
                        Don&apos;t have an account?{' '}
                        <Link style={{ color: `${theme.palette.primary.main}` }} to='/register'>
                            Sign up for free
                        </Link>
                        .
                    </Typography>
                )}
                {isEnterpriseLicensed && (
                    <Typography variant='body2' sx={{ color: theme.palette.grey[600] }}>
                        Have an invite code?{' '}
                        <Link style={{ color: `${theme.palette.primary.main}` }} to='/register'>
                            {organizationSlug ? 'Join this organisation' : 'Sign up for an account'}
                        </Link>
                        .
                    </Typography>
                )}
            </Stack>
            <form onSubmit={doLogin}>
                <Stack sx={{ width: '100%', gap: 3 }}>
                    <Box>
                        <Typography sx={{ mb: 1 }}>
                            Email<span style={{ color: theme.palette.error.main }}>&nbsp;*</span>
                        </Typography>
                        <Input
                            inputParam={usernameInput}
                            onChange={(newValue) => setUsernameVal(newValue)}
                            value={usernameVal}
                            showDialog={false}
                        />
                    </Box>
                    <Box>
                        <Stack direction='row' sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
                            <Typography>
                                Password<span style={{ color: theme.palette.error.main }}>&nbsp;*</span>
                            </Typography>
                            <Link style={{ color: theme.palette.primary.main, fontSize: '14px' }} to='/forgot-password'>
                                Forgot password?
                            </Link>
                        </Stack>
                        <Input inputParam={passwordInput} onChange={(newValue) => setPasswordVal(newValue)} value={passwordVal} />
                    </Box>
                    <LoadingButton fullWidth loading={loading} variant='contained' style={{ height: 52, borderRadius: 12 }} type='submit'>
                        Sign in
                    </LoadingButton>
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
            {!organizationSlug && isEnterpriseLicensed && (
                <>
                    <Divider />
                    <Stack sx={{ gap: 1, textAlign: 'center' }}>
                        <Typography variant='body2' sx={{ color: theme.palette.grey[600] }}>
                            No organisation yet?
                        </Typography>
                        <Link style={{ color: theme.palette.primary.main, fontWeight: 500 }} to='/organization-setup'>
                            Create your organisation
                        </Link>
                    </Stack>
                </>
            )}
        </>
    )

    return organizationSlug ? (
        <AuthSplitShell
            headline='Every consequential action still waits for a person.'
            subtitle='Autonomous, review, approval — the three tiers are built into the run, not bolted on after.'
            panelExtra={
                <Stack sx={{ gap: 1.5 }}>
                    {GOVERNANCE_TIERS.map((tier) => (
                        <Stack key={tier.label} direction='row' sx={{ alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    px: 1.25,
                                    py: 0.5,
                                    borderRadius: '8px',
                                    background: tier.bg,
                                    color: tier.color,
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    letterSpacing: '0.04em'
                                }}
                            >
                                {tier.label}
                            </Box>
                            <Typography sx={{ fontSize: '15px', lineHeight: 1.5, fontWeight: 300, color: '#fff' }}>
                                {tier.description}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
            }
        >
            {formBody}
        </AuthSplitShell>
    ) : (
        <AuthCenteredShell>{formBody}</AuthCenteredShell>
    )
}

export default SignInPage
