"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ChatflowApi {
    constructor() {
        this.label = 'Chatflow API';
        this.name = 'chatflowApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Chatflow Api Key',
                name: 'chatflowApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: ChatflowApi };
//# sourceMappingURL=ChatflowApi.credential.js.map