import { INodeParams, INodeCredential } from '../src/Interface'

class GitLabApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'GitLab API'
        this.name = 'gitlabApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://docs.gitlab.com/user/profile/personal_access_tokens/">official guide</a> on how to create a Personal Access Token from GitLab User Settings → Access Tokens'
        this.inputs = [
            {
                label: 'Personal Access Token',
                name: 'personalAccessToken',
                type: 'password',
                placeholder: '<GITLAB_PERSONAL_ACCESS_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: GitLabApi }
