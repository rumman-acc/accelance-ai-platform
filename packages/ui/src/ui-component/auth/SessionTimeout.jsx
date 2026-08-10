import { useEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { API_BASE_PATH, baseURL } from '@/store/constant'
import { store } from '@/store'
import { logoutSuccess } from '@/store/reducers/authSlice'

const IDLE_TIMEOUT_MS = 60 * 60 * 1000
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

const SessionTimeout = () => {
    const navigate = useNavigate()
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
    const timeoutRef = useRef(null)
    const hasLoggedOutRef = useRef(false)

    useEffect(() => {
        if (!isAuthenticated) {
            hasLoggedOutRef.current = false
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
            return
        }

        const logoutForInactivity = async () => {
            if (hasLoggedOutRef.current) return
            hasLoggedOutRef.current = true

            try {
                await axios.post(`${baseURL}${API_BASE_PATH}/account/logout`, {}, { withCredentials: true })
            } catch (error) {
                // Ignore logout API failures and still clear client auth state.
            } finally {
                store.dispatch(logoutSuccess())
                navigate('/login', { replace: true, state: { reason: 'idle-timeout' } })
            }
        }

        const resetTimer = () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current)
            }
            timeoutRef.current = window.setTimeout(logoutForInactivity, IDLE_TIMEOUT_MS)
        }

        resetTimer()
        ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }))

        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
            ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, resetTimer))
        }
    }, [isAuthenticated, navigate])

    return null
}

export default SessionTimeout
