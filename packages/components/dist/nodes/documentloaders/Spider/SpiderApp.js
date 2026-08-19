'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const httpSecurity_1 = require('../../../src/httpSecurity')
class SpiderApp {
    constructor({ apiKey = null, apiUrl = null }) {
        this.apiKey = apiKey || ''
        this.apiUrl = apiUrl || 'https://api.spider.cloud/v1'
        if (!this.apiKey) {
            throw new Error('No API key provided')
        }
    }
    async scrapeUrl(url, params = null) {
        const headers = this.prepareHeaders()
        const jsonData = { url, limit: 1, ...params }
        try {
            const response = await this.postRequest('crawl', jsonData, headers)
            if (response.status === 200) {
                const responseData = response.data
                if (responseData[0].status) {
                    return { success: true, data: responseData[0] }
                } else {
                    throw new Error(`Failed to scrape URL. Error: ${responseData.error}`)
                }
            } else {
                this.handleError(response, 'scrape URL')
            }
        } catch (error) {
            throw new Error(error.message)
        }
        return { success: false, error: 'Internal server error.' }
    }
    async crawlUrl(url, params = null, idempotencyKey) {
        const headers = this.prepareHeaders(idempotencyKey)
        const jsonData = { url, ...params }
        try {
            const response = await this.postRequest('crawl', jsonData, headers)
            if (response.status === 200) {
                return { success: true, data: response.data }
            } else {
                this.handleError(response, 'start crawl job')
            }
        } catch (error) {
            throw new Error(error.message)
        }
        return { success: false, error: 'Internal server error.' }
    }
    prepareHeaders(idempotencyKey) {
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            ...(idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {})
        }
    }
    postRequest(url, data, headers) {
        return (0, httpSecurity_1.secureAxiosRequest)({ method: 'POST', url: `${this.apiUrl}/${url}`, data, headers })
    }
    handleError(response, action) {
        if ([402, 408, 409, 500].includes(response.status)) {
            const errorMessage = response.data.error || 'Unknown error occurred'
            throw new Error(`Failed to ${action}. Status code: ${response.status}. Error: ${errorMessage}`)
        } else {
            throw new Error(`Unexpected error occurred while trying to ${action}. Status code: ${response.status}`)
        }
    }
}
exports.default = SpiderApp
//# sourceMappingURL=SpiderApp.js.map
