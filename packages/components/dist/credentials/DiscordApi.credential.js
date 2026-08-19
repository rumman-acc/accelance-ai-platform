'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
class DiscordApi {
    constructor() {
        this.label = 'Discord API'
        this.name = 'discordApi'
        this.version = 1.0
        this.description =
            'Bot token from the <a target="_blank" href="https://discord.com/developers/applications">Discord Developer Portal</a> (Applications → your app → Bot → Token). The bot must be invited to the target server/channel with the relevant permissions.'
        this.inputs = [
            {
                label: 'Bot Token',
                name: 'botToken',
                type: 'password',
                placeholder: '<DISCORD_BOT_TOKEN>'
            }
        ]
    }
}
module.exports = { credClass: DiscordApi }
//# sourceMappingURL=DiscordApi.credential.js.map
