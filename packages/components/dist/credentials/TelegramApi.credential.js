'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
class TelegramApi {
    constructor() {
        this.label = 'Telegram API'
        this.name = 'telegramApi'
        this.version = 1.0
        this.description =
            'Bot token obtained from <a target="_blank" href="https://core.telegram.org/bots#botfather">@BotFather</a> on Telegram. Message @BotFather, run /newbot (or /token for an existing bot), and copy the token it gives you.'
        this.inputs = [
            {
                label: 'Bot Token',
                name: 'botToken',
                type: 'password',
                placeholder: '<TELEGRAM_BOT_TOKEN>'
            }
        ]
    }
}
module.exports = { credClass: TelegramApi }
//# sourceMappingURL=TelegramApi.credential.js.map
