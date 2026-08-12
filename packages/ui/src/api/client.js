import axios from 'axios'
import { API_BASE_PATH, baseURL, ErrorMessage } from '@/store/constant'
import AuthUtils from '@/utils/authUtils'

const apiClient = axios.create({
    baseURL: `${baseURL}${API_BASE_PATH}`,
    headers: {
        'Content-type': 'application/json',
        'x-request-from': 'internal'
    },
    withCredentials: true
})

const shouldClearClientAuth = (error) => {
    if (error?.response?.status !== 401) return false

    const message = error?.response?.data?.message
    return message === ErrorMessage.INVALID_MISSING_TOKEN || message === ErrorMessage.REFRESH_TOKEN_EXPIRED
}

apiClient.interceptors.response.use(
    function (response) {
        return response
    },
    async (error) => {
        if (error?.response?.status === 401) {
            // check if refresh is needed
            if (error.response.data.message === ErrorMessage.TOKEN_EXPIRED && error.response.data.retry === true) {
                const originalRequest = error.config
                try {
                    // call api to get new token
                    const response = await axios.post(`${baseURL}${API_BASE_PATH}/auth/refreshToken`, {}, { withCredentials: true })
                    if (response.data.id) {
                        // retry the original request
                        return apiClient.request(originalRequest)
                    }
                } catch (refreshError) {
                    error = refreshError
                }
            }
        }

        if (shouldClearClientAuth(error)) {
            localStorage.removeItem('username')
            localStorage.removeItem('password')
            AuthUtils.removeCurrentUser()
        }

        return Promise.reject(error)
    }
)

export default apiClient
