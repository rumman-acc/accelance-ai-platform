'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
class BitbucketApi {
    constructor() {
        this.label = 'Bitbucket API'
        this.name = 'bitbucketApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://support.atlassian.com/bitbucket-cloud/docs/create-an-app-password/">official guide</a> on how to create an App Password from Bitbucket Personal Settings → App passwords'
        this.inputs = [
            {
                label: 'Username',
                name: 'username',
                type: 'string',
                placeholder: 'username'
            },
            {
                label: 'App Password',
                name: 'appPassword',
                type: 'password',
                placeholder: '<BITBUCKET_APP_PASSWORD>'
            }
        ]
    }
}
module.exports = { credClass: BitbucketApi }
//# sourceMappingURL=BitbucketApi.credential.js.map
