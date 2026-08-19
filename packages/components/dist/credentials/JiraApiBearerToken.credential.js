"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JiraApiBearerToken {
    constructor() {
        this.label = 'Jira API (Bearer Token)';
        this.name = 'jiraApiBearerToken';
        this.version = 1.0;
        this.description =
            'Use Personal Access Token (PAT) for Jira Server/Data Center. Refer to <a target="_blank" href="https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html">official guide</a> on how to create a PAT.';
        this.inputs = [
            {
                label: 'Bearer Token',
                name: 'bearerToken',
                type: 'password',
                placeholder: '<JIRA_PERSONAL_ACCESS_TOKEN>'
            }
        ];
    }
}
module.exports = { credClass: JiraApiBearerToken };
//# sourceMappingURL=JiraApiBearerToken.credential.js.map