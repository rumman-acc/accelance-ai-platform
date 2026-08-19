'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
class DropboxApi {
    constructor() {
        this.label = 'Dropbox API'
        this.name = 'dropboxApi'
        this.version = 1.0
        this.description =
            'Generate an access token from a scoped app in the <a target="_blank" href="https://www.dropbox.com/developers/apps">Dropbox App Console</a> (not a full OAuth2 refresh flow)'
        this.inputs = [
            {
                label: 'Access Token',
                name: 'accessToken',
                type: 'password',
                placeholder: '<DROPBOX_ACCESS_TOKEN>'
            }
        ]
    }
}
module.exports = { credClass: DropboxApi }
//# sourceMappingURL=DropboxApi.credential.js.map
