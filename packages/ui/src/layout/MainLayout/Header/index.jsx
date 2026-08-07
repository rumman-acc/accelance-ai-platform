import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// material-ui
import { Button, Avatar, Box, ButtonBase, Typography, Link } from '@mui/material'
import { useTheme, darken } from '@mui/material/styles'

// project imports
import LogoSection from '../LogoSection'
import ProfileSection from './ProfileSection'
import OrgWorkspaceBreadcrumbs from '@/layout/MainLayout/Header/OrgWorkspaceBreadcrumbs'
import PricingDialog from '@/ui-component/subscription/PricingDialog'

// assets
import { IconMenu2, IconX, IconSparkles } from '@tabler/icons-react'

// store
import { store } from '@/store'
import { useConfig } from '@/store/context/ConfigContext'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import { logoutSuccess } from '@/store/reducers/authSlice'

// API
import accountApi from '@/api/account.api'

// Hooks
import useApi from '@/hooks/useApi'
import useNotifier from '@/utils/useNotifier'

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

const GitHubStarButton = ({ starCount, isDark }) => {
    const theme = useTheme()

    const formattedStarCount = starCount.toLocaleString()

    return (
        <Link href='https://github.com/accelance' target='_blank' underline='none' sx={{ display: 'inline-flex' }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                    fontSize: '12px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
                    fontWeight: 600,
                    lineHeight: 1
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '3px 10px',
                        backgroundColor: isDark ? darken(theme.palette.background.paper, 0.2) : '#f6f8fa',
                        color: isDark ? '#c9d1d9' : '#24292e',
                        borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`
                    }}
                >
                    <svg height='16' width='16' viewBox='0 0 16 16' style={{ marginRight: '4px', fill: isDark ? '#c9d1d9' : '#24292e' }}>
                        <path
                            fillRule='evenodd'
                            d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z'
                        ></path>
                    </svg>
                    <Typography variant='caption' sx={{ fontWeight: 600, color: isDark ? 'white' : theme.palette.text.primary }}>
                        Star
                    </Typography>
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '3px 10px',
                        backgroundColor: isDark ? theme.palette.background.paper : 'white'
                    }}
                >
                    <Typography variant='caption' sx={{ fontWeight: 600, color: isDark ? 'white' : theme.palette.text.primary }}>
                        {formattedStarCount}
                    </Typography>
                </Box>
            </Box>
        </Link>
    )
}

GitHubStarButton.propTypes = {
    starCount: PropTypes.number.isRequired,
    isDark: PropTypes.bool.isRequired
}

const Header = ({ handleLeftDrawerToggle }) => {
    const theme = useTheme()
    const navigate = useNavigate()

    const logoutApi = useApi(accountApi.logout)

    const dispatch = useDispatch()
    const { isEnterpriseLicensed, isCloud, isOpenSource } = useConfig()
    const currentUser = useSelector((state) => state.auth.user)
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
    const [isPricingOpen, setIsPricingOpen] = useState(false)
    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const signOutClicked = () => {
        logoutApi.request()
        enqueueSnackbar({
            message: 'Logging out...',
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

    useEffect(() => {
        try {
            if (logoutApi.data && logoutApi.data.message === 'logged_out') {
                store.dispatch(logoutSuccess())
                window.location.href = logoutApi.data.redirectTo
            }
        } catch (e) {
            console.error(e)
        }
    }, [logoutApi.data])

    return (
        <>
            <Box
                sx={{
                    width: 228,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    [theme.breakpoints.down('md')]: {
                        width: 'auto'
                    }
                }}
            >
                <Box component='span' sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                    <LogoSection />
                </Box>
                {isAuthenticated && (
                    <ButtonBase sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                        <Avatar
                            variant='rounded'
                            sx={{
                                ...theme.typography.commonAvatar,
                                ...theme.typography.mediumAvatar,
                                transition: 'all .2s ease-in-out',
                                background: theme.palette.primary.light,
                                color: theme.palette.primary.dark,
                                '&:hover': {
                                    background: theme.palette.primary.main,
                                    color: theme.palette.primary.light
                                }
                            }}
                            onClick={handleLeftDrawerToggle}
                            color='inherit'
                        >
                            <IconMenu2 stroke={1.5} size='1.3rem' />
                        </Avatar>
                    </ButtonBase>
                )}
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            {(isEnterpriseLicensed || isCloud) && isAuthenticated && <OrgWorkspaceBreadcrumbs />}
            {isCloud && currentUser?.isOrganizationAdmin && (
                <Button
                    variant='contained'
                    sx={{
                        mr: 1,
                        ml: 2,
                        borderRadius: 15,
                        background: (theme) =>
                            `linear-gradient(90deg, ${theme.palette.primary.main} 10%, ${theme.palette.secondary.main} 100%)`,
                        color: (theme) => theme.palette.secondary.contrastText,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            background: (theme) =>
                                `linear-gradient(90deg, ${darken(theme.palette.primary.main, 0.1)} 10%, ${darken(
                                    theme.palette.secondary.main,
                                    0.1
                                )} 100%)`,
                            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                        }
                    }}
                    onClick={() => setIsPricingOpen(true)}
                    startIcon={<IconSparkles size={20} />}
                >
                    Upgrade
                </Button>
            )}
            {isPricingOpen && isCloud && (
                <PricingDialog
                    open={isPricingOpen}
                    onClose={(planUpdated) => {
                        setIsPricingOpen(false)
                        if (planUpdated) {
                            navigate('/')
                            navigate(0)
                        }
                    }}
                />
            )}
            <ProfileSection handleLogout={signOutClicked} />
        </>
    )
}

Header.propTypes = {
    handleLeftDrawerToggle: PropTypes.func
}

export default Header
