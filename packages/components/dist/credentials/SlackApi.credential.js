"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SlackApi {
    constructor() {
        this.label = 'Slack Bot Token';
        this.name = 'slackApi';
        this.version = 1.0;
        this.description =
            'Refer to <a target="_blank" href="https://github.com/modelcontextprotocol/servers/tree/main/src/slack">official guide</a> on how to get botToken and teamId on Slack';
        this.inputs = [
            {
                label: 'Bot Token',
                name: 'botToken',
                type: 'password'
            },
            {
                label: 'Team ID',
                name: 'teamId',
                type: 'string',
                placeholder: '<SLACK_TEAM_ID>'
            }
        ];
    }
}
module.exports = { credClass: SlackApi };
//# sourceMappingURL=SlackApi.credential.js.map