"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AlibabaApi {
    constructor() {
        this.label = 'Alibaba API';
        this.name = 'AlibabaApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Alibaba Api Key',
                name: 'alibabaApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: AlibabaApi };
//# sourceMappingURL=AlibabaApi.credential.js.map